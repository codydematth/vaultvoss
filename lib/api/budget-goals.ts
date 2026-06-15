import {apiClient} from './client';
import type {
  ApiResponse,
  BudgetGoal,
  BudgetGoalCreate,
  BudgetGoalStatus,
  BudgetGoalUpdate,
} from './types';

export const budgetGoalsApi = {
  list: () =>
    apiClient.get<ApiResponse<BudgetGoal[]>>('/budget-goals/'),

  create: (p: BudgetGoalCreate) =>
    apiClient.post<ApiResponse<BudgetGoal>>('/budget-goals/', p),

  getStatus: (goalId: string) =>
    apiClient.get<ApiResponse<BudgetGoalStatus>>(`/budget-goals/${goalId}/status`),

  update: (goalId: string, p: BudgetGoalUpdate) =>
    apiClient.patch<ApiResponse<BudgetGoal>>(`/budget-goals/${goalId}`, p),

  delete: (goalId: string) =>
    apiClient.delete<ApiResponse<null>>(`/budget-goals/${goalId}`),
};
