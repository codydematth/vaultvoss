const { withMainActivity } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

module.exports = function withAndroidSwitcherSecurity(config) {
  return withMainActivity(config, (config) => {
    const isKotlin = config.modResults.language === 'kt';
    
    let newCode = '';
    if (isKotlin) {
      newCode = `
  override fun onPause() {
    super.onPause()
    window.setFlags(
      android.view.WindowManager.LayoutParams.FLAG_SECURE,
      android.view.WindowManager.LayoutParams.FLAG_SECURE
    )
  }

  override fun onResume() {
    super.onResume()
    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
  }
      `;
    } else {
      newCode = `
  @Override
  protected void onPause() {
    super.onPause();
    getWindow().setFlags(
      android.view.WindowManager.LayoutParams.FLAG_SECURE,
      android.view.WindowManager.LayoutParams.FLAG_SECURE
    );
  }

  @Override
  protected void onResume() {
    super.onResume();
    getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
  }
      `;
    }

    config.modResults.contents = mergeContents({
      tag: 'android-switcher-security',
      src: config.modResults.contents,
      newSrc: newCode,
      anchor: /class MainActivity|public class MainActivity/,
      offset: 1,
      comment: '//',
    }).contents;

    return config;
  });
};
