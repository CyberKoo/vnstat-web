import postcssGlobalData from '@csstools/postcss-global-data';
import postcssCustomMedia from 'postcss-custom-media';

export default {
    plugins: [
        // Inject @custom-media definitions into every CSS file so Vue SFC scoped styles
        // (which are processed independently) can resolve --mobile / --tablet / --desktop.
        // Must run before postcss-custom-media.
        postcssGlobalData({
            files: ['src/assets/styles/custom-media.css'],
        }),
        postcssCustomMedia(),
    ],
};
