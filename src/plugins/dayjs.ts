import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-hk';
import 'dayjs/locale/en';
import 'dayjs/locale/ja';
import 'dayjs/locale/ru';
import 'dayjs/locale/de';
import 'dayjs/locale/es';

// Plugins in use, enabled as needed
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Enable the plugins
dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(quarterOfYear);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

// Set the locale and the default time zone (as needed).
// The locale is only the bootstrap default; `useLocaleStore` overrides it at
// runtime so it follows the UI language. The time zone is not a display
// preference and stays fixed.
dayjs.locale('en');
dayjs.tz.setDefault('Asia/Shanghai');

export default dayjs;
export type { Dayjs } from 'dayjs';
