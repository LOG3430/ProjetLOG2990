export const N_MS_IN_SECONDS = 1000;
export const N_SECONDS_IN_MINUTE = 60;
export const N_MINUTES_IN_HOUR = 60;
export const N_HOURS_IN_DAY = 24;
export const N_DAYS_IN_MONTH = 30;
export const N_MONTHS_IN_YEAR = 12;

// constants required for tests:
// disabled no-magic-numbers because this is a constant file
/* eslint-disable @typescript-eslint/no-magic-numbers */
export const TEN_SECONDS = 10 * N_MS_IN_SECONDS;
export const TWO_MINUTES = 2 * N_SECONDS_IN_MINUTE * N_MS_IN_SECONDS;
export const TWO_HOURS = 2 * N_MINUTES_IN_HOUR * N_SECONDS_IN_MINUTE * N_MS_IN_SECONDS;
export const TWO_DAYS = 2 * N_HOURS_IN_DAY * N_MINUTES_IN_HOUR * N_SECONDS_IN_MINUTE * N_MS_IN_SECONDS;
export const TWO_MONTHS = 2 * N_DAYS_IN_MONTH * N_HOURS_IN_DAY * N_MINUTES_IN_HOUR * N_SECONDS_IN_MINUTE * N_MS_IN_SECONDS;
export const TWO_YEARS = 2 * N_MONTHS_IN_YEAR * N_DAYS_IN_MONTH * N_HOURS_IN_DAY * N_MINUTES_IN_HOUR * N_SECONDS_IN_MINUTE * N_MS_IN_SECONDS;

export const DATE_FORMAT_PADDING_SIZE = 2;
export const DATE_FORMAT_MONTH_OFFSET = 1;
