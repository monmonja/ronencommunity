export default {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-scss"],
  rules: {
    "no-descending-specificity": null,
    "media-feature-range-notation": "prefix",
    'max-nesting-depth': [
      5,
      {
        ignoreAtRules: ['each', 'media', 'supports', 'include'],
        severity: 'warning',
      },
    ],
  }
};
