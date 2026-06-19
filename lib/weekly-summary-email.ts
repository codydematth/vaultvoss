import { Resend } from 'resend';
import { transactionsApi } from './api/transactions';
import { storage } from './storage';
import type { User } from './api/types';

/**
 * Checks if a weekly summary email is due and sends it to the user via Resend API.
 */
export async function checkAndSendWeeklySummaryEmail() {
  try {
    // 1. Check if weekly summary notifications/emails are enabled
    const isWeeklyEnabled = await storage.getNotifWeeklyEnabled();
    if (!isWeeklyEnabled) return;

    // 2. Resolve authentication / current user
    const userRaw = await storage.getUser();
    if (!userRaw) return;
    const user = userRaw as User;
    if (!user.email) return;

    // 3. Determine if weekly summary email is due (Sunday 6 PM onwards, once a week)
    const now = new Date();
    const lastSentStr = await storage.getLastWeeklyEmailSent();
    
    let shouldSend = false;
    if (!lastSentStr) {
      shouldSend = true;
    } else {
      const lastSent = new Date(lastSentStr);
      
      // Calculate the most recent Sunday at 6:00 PM before (or on) today
      const currentSunday = new Date(now);
      const day = currentSunday.getDay(); // 0 is Sunday
      currentSunday.setDate(currentSunday.getDate() - day);
      currentSunday.setHours(18, 0, 0, 0); // Sunday 6:00 PM

      // If we are past this Sunday 6:00 PM, and the last email was sent before this Sunday 6:00 PM
      if (now >= currentSunday && lastSent < currentSunday) {
        shouldSend = true;
      }
    }

    if (!shouldSend) {
      console.log('[Weekly Summary] Email is not due yet.');
      return;
    }

    // 4. Retrieve Resend API Key from environment variables
    const resendKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;
    if (!resendKey) {
      console.warn('[Weekly Summary] EXPO_PUBLIC_RESEND_API_KEY is not defined in environment variables. Email send skipped.');
      return;
    }

    console.log('[Weekly Summary] Generating weekly report...');

    // 5. Fetch transactions from the past 7 days
    const toDateStr = now.toISOString().split('T')[0];
    const fromDateObj = new Date(now);
    fromDateObj.setDate(fromDateObj.getDate() - 7);
    const fromDateStr = fromDateObj.toISOString().split('T')[0];

    const { data: res } = await transactionsApi.list({ date_from: fromDateStr, date_to: toDateStr });
    const transactions = res.data ?? [];

    // 6. Aggregate calculations
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.transaction_type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const cat = tx.expense_category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const currencySymbol = transactions[0]?.currency ?? 'USD';

    // Format money helper for email
    const fmt = (val: number) => {
      const formatted = Math.abs(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${currencySymbol === 'USD' ? '$' : currencySymbol === 'EUR' ? '€' : currencySymbol === 'GBP' ? '£' : currencySymbol + ' '}${formatted}`;
    };

    // Sort categories by highest spend
    const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

    // Build transactions rows
    const txRows = transactions.length > 0 
      ? transactions.slice(0, 10).map(tx => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 12px; color: #1F2937; font-size: 14px;">${tx.transaction_name}</td>
            <td style="padding: 12px; color: #6B7280; font-size: 14px;">${tx.expense_category || tx.income_category || 'Other'}</td>
            <td style="padding: 12px; font-weight: 600; font-size: 14px; text-align: right; color: ${tx.transaction_type === 'income' ? '#10B981' : '#EF4444'};">
              ${tx.transaction_type === 'income' ? '+' : '-'}${fmt(Number(tx.amount))}
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" style="padding: 24px; text-align: center; color: #9CA3AF; font-size: 14px;">No transactions recorded this week.</td></tr>`;

    // Category breakdown list HTML
    const catRows = sortedCategories.length > 0 
      ? sortedCategories.map(([cat, val]) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; color: #4B5563;">
            <span>${cat}</span>
            <span style="font-weight: 600; color: #1F2937;">${fmt(val)}</span>
          </div>
        `).join('')
      : `<p style="font-size: 14px; color: #9CA3AF; text-align: center; margin: 12px 0;">No spending recorded by category.</p>`;

    // 7. Compile HTML Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VaultVoss Weekly Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0088FF; padding: 32px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">VaultVoss</h1>
              <p style="color: rgba(255, 255, 255, 0.85); margin: 8px 0 0 0; font-size: 14px;">Weekly Financial Summary</p>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; color: #1F2937; margin: 0 0 24px 0; font-weight: 500;">Hello ${user.full_name},</p>
              <p style="font-size: 14px; color: #4B5563; line-height: 22px; margin: 0 0 24px 0;">Here is your weekly summary of income, expenses, and savings compiled between <strong>${fromDateStr}</strong> and <strong>${toDateStr}</strong>.</p>
              
              <!-- Metrics Cards -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-right: 8px; padding-bottom: 8px;">
                    <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; text-align: center;">
                      <span style="font-size: 12px; color: #065F46; font-weight: 600; text-transform: uppercase;">Total Income</span>
                      <div style="font-size: 18px; color: #047857; font-weight: 700; margin-top: 4px;">${fmt(totalIncome)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px; padding-bottom: 8px;">
                    <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 16px; text-align: center;">
                      <span style="font-size: 12px; color: #991B1B; font-weight: 600; text-transform: uppercase;">Total Expenses</span>
                      <div style="font-size: 18px; color: #B91C1C; font-weight: 700; margin-top: 4px;">${fmt(totalExpense)}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding-right: 8px; padding-top: 8px;">
                    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; text-align: center;">
                      <span style="font-size: 12px; color: #1E40AF; font-weight: 600; text-transform: uppercase;">Net Savings</span>
                      <div style="font-size: 18px; color: #1D4ED8; font-weight: 700; margin-top: 4px;">${netSavings >= 0 ? '+' : ''}${fmt(netSavings)}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px; padding-top: 8px;">
                    <div style="background-color: #FDF4FF; border: 1px solid #F5D0FE; border-radius: 12px; padding: 16px; text-align: center;">
                      <span style="font-size: 12px; color: #86198F; font-weight: 600; text-transform: uppercase;">Savings Rate</span>
                      <div style="font-size: 18px; color: #701A75; font-weight: 700; margin-top: 4px;">${savingsRate.toFixed(0)}%</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Category Spending breakdown -->
              <h2 style="font-size: 16px; color: #1F2937; margin: 28px 0 12px 0; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; font-weight: 600;">Spending by Category</h2>
              <div style="margin-bottom: 24px;">
                ${catRows}
              </div>

              <!-- Recent Transactions -->
              <h2 style="font-size: 16px; color: #1F2937; margin: 28px 0 12px 0; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; font-weight: 600;">Recent Transactions</h2>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 8px;">
                <thead>
                  <tr style="border-bottom: 2px solid #E5E7EB; text-align: left;">
                    <th style="padding: 8px 12px; font-size: 12px; color: #4B5563; font-weight: 600;">Name</th>
                    <th style="padding: 8px 12px; font-size: 12px; color: #4B5563; font-weight: 600;">Category</th>
                    <th style="padding: 8px 12px; font-size: 12px; color: #4B5563; font-weight: 600; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${txRows}
                </tbody>
              </table>

              <p style="font-size: 12px; color: #9CA3AF; margin-top: 32px; line-height: 18px;">This is an automated email summary generated by VaultVoss app. If you no longer wish to receive weekly summary emails, you can disable them in the VaultVoss App Settings under Notifications.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">&copy; 2026 VaultVoss. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 8. Dispatch Email via Resend Package
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from: 'VaultVoss <notification@matthiasamire.com>',
      to: user.email,
      subject: `VaultVoss Weekly Summary (${fromDateStr} - ${toDateStr})`,
      html: htmlContent,
    });

    if (!error) {
      await storage.setLastWeeklyEmailSent(now.toISOString());
      console.log('[Weekly Summary] Email dispatched successfully to ' + user.email + (data ? ' ID: ' + data.id : ''));
    } else {
      console.error('[Weekly Summary] Resend SDK failed: ', error);
    }
  } catch (error) {
    console.error('[Weekly Summary] Error running weekly summary email check: ', error);
  }
}
