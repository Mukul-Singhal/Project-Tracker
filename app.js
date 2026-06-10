// ════════════════════════════════════════════════════════════════
// § 1  CONSTANTS + CORE UTILITIES
// ════════════════════════════════════════════════════════════════

const COL = 52, ROH = 90, YH = 34, MH = 30;
const PDF_EXPORT_HORIZONTAL_SCALE = 0.8;
const SHIFT_ARROW_ARCH = 46;
const $ = id => document.getElementById(id);
const STORAGE_PREFIX = 'project-tracker';
const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;
const TIMELINE_VERSION_CURRENT = 'current';
const TIMELINE_VERSION_PREFIX = 'cutoff:';

const fmtDate = d => {
  if (!d) return '';
  const [y, m] = d.split('-');
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1] + ' ' + y;
};

function cloneState(v) {
  return JSON.parse(JSON.stringify(v));
}

const STAGE_ICONS = [
  {
    id: 'stage-logo-1',
    label: 'Stage Logo 1',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint0_linear_526_2297)" stroke-width="2"/>
<path d="M35.6036 33.6936C36.3388 34.4287 36.0024 35.6841 34.9981 35.9532C34.5321 36.078 34.0348 35.9448 33.6936 35.6036L22.5 24.4083L11.3064 35.6036C10.5713 36.3388 9.31594 36.0024 9.04685 34.9981C8.92197 34.5321 9.05522 34.0348 9.39641 33.6936L20.5917 22.5L9.39641 11.3064C8.66124 10.5713 8.9976 9.31594 10.0019 9.04685C10.4679 8.92197 10.9652 9.05522 11.3064 9.39641L22.5 20.5917L33.6936 9.39641C34.4287 8.66124 35.6841 8.9976 35.9532 10.0019C36.078 10.4679 35.9448 10.9652 35.6036 11.3064L24.4083 22.5L35.6036 33.6936Z" fill="url(#paint1_linear_526_2297)"/>
<defs>
<linearGradient id="paint0_linear_526_2297" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_526_2297" x1="2.58416" y1="9.52397" x2="3.31955" y2="40.2425" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-2',
    label: 'Stage Logo 2',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint0_linear_526_2287)" stroke-width="2"/>
<mask id="path-2-inside-1_526_2287" fill="white">
<path d="M15 15H31V31H15V15Z"/>
</mask>
<path d="M31 15H33V13H31V15ZM31 31V33H33V31H31ZM15 15V17H31V15V13H15V15ZM31 15H29V31H31H33V15H31ZM31 31V29H15V31V33H31V31Z" fill="url(#paint1_linear_526_2287)" mask="url(#path-2-inside-1_526_2287)"/>
<defs>
<linearGradient id="paint0_linear_526_2287" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_526_2287" x1="11.198" y1="15.3105" x2="11.6338" y2="33.5141" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-3',
    label: 'Stage Logo 3',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint0_linear_527_2382)" stroke-width="2"/>
<path d="M16 14H26.2667C26.819 14 27.2667 14.4477 27.2667 15V19.0198C27.2667 19.2647 27.1768 19.5011 27.0141 19.6842L16.8667 31.1L22.3432 25.4128C22.6834 25.0595 23.2298 25.0032 23.6189 25.3017C25.485 26.7333 28.3885 29.46 29 32" stroke="url(#paint1_linear_527_2382)" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2382" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2382" x1="12.9109" y1="14.3493" x2="13.5894" y2="34.8176" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-4',
    label: 'Stage Logo 4',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_527_2305)">
<path d="M33.2386 18H30.0682C29.8807 17.0881 29.5526 16.2869 29.0838 15.5966C28.6236 14.9062 28.0611 14.3267 27.3963 13.858C26.7401 13.3807 26.0114 13.0227 25.2102 12.7841C24.4091 12.5455 23.5739 12.4261 22.7045 12.4261C21.1193 12.4261 19.6832 12.8267 18.3963 13.6278C17.1179 14.429 16.0994 15.6094 15.3409 17.169C14.5909 18.7287 14.2159 20.642 14.2159 22.9091C14.2159 25.1761 14.5909 27.0895 15.3409 28.6491C16.0994 30.2088 17.1179 31.3892 18.3963 32.1903C19.6832 32.9915 21.1193 33.392 22.7045 33.392C23.5739 33.392 24.4091 33.2727 25.2102 33.0341C26.0114 32.7955 26.7401 32.4418 27.3963 31.973C28.0611 31.4957 28.6236 30.9119 29.0838 30.2216C29.5526 29.5227 29.8807 28.7216 30.0682 27.8182H33.2386C33 29.1562 32.5653 30.3537 31.9347 31.4105C31.304 32.4673 30.5199 33.3665 29.5824 34.108C28.6449 34.8409 27.5923 35.3991 26.4247 35.7827C25.2656 36.1662 24.0256 36.358 22.7045 36.358C20.4716 36.358 18.4858 35.8125 16.7472 34.7216C15.0085 33.6307 13.6406 32.0795 12.6435 30.0682C11.6463 28.0568 11.1477 25.6705 11.1477 22.9091C11.1477 20.1477 11.6463 17.7614 12.6435 15.75C13.6406 13.7386 15.0085 12.1875 16.7472 11.0966C18.4858 10.0057 20.4716 9.46023 22.7045 9.46023C24.0256 9.46023 25.2656 9.65199 26.4247 10.0355C27.5923 10.419 28.6449 10.9815 29.5824 11.723C30.5199 12.456 31.304 13.3509 31.9347 14.4077C32.5653 15.456 33 16.6534 33.2386 18Z" fill="url(#paint0_linear_527_2305)"/>
</g>
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint1_linear_527_2305)" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2305" x1="2.58416" y1="1.85388" x2="4.53529" y2="51.8662" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2305" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<clipPath id="clip0_527_2305">
<rect x="3" y="3" width="39" height="39" rx="19.5" fill="white"/>
</clipPath>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-5',
    label: 'Stage Logo 5',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="6" y="7" width="33" height="19" rx="1" stroke="url(#paint0_linear_527_2309)" stroke-width="2"/>
<path d="M6 26C10.6406 19.963 23.7375 11.5112 39 26H6Z" fill="url(#paint1_linear_527_2309)"/>
<path d="M30 8L30 17" stroke="#416AFD" stroke-width="2" stroke-linecap="round"/>
<path d="M25 8L25 13" stroke="#416AFD" stroke-width="2" stroke-linecap="round"/>
<path d="M14 14.6849V7.5C14 7.22386 14.2239 7 14.5 7H19.5C19.7761 7 20 7.22386 20 7.5V14.2834C20 14.7211 19.4774 14.9475 19.158 14.6482L17.3746 12.9762C17.1693 12.7837 16.8458 12.7985 16.6589 13.0087L14.8737 15.0171C14.5683 15.3607 14 15.1447 14 14.6849Z" fill="#416AFD"/>
<path d="M30.2383 35.25H14.7617L22.5 26.5088L30.2383 35.25Z" stroke="#092C95" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2309" x1="-3.31683" y1="6.40753" x2="-2.97352" y2="30.3085" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2309" x1="-1.84158" y1="18.1553" x2="-1.78873" y2="27.2619" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-6',
    label: 'Stage Logo 6',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="6" y="7" width="33" height="19" rx="1" stroke="url(#paint0_linear_527_2330)" stroke-width="2"/>
<path d="M30.2383 35.25H14.7617L22.5 26.5088L30.2383 35.25Z" stroke="#092C95" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2330" x1="-3.31683" y1="6.40753" x2="-2.97352" y2="30.3085" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-7',
    label: 'Stage Logo 7',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_527_2338)">
<path d="M42.9521 40H3.04785L23 4.06055L42.9521 40Z" stroke="#092C95" stroke-width="2"/>
<path d="M29.1074 31.25H16.8926L23 20.084L29.1074 31.25Z" stroke="#092C95" stroke-width="2"/>
</g>
<defs>
<clipPath id="clip0_527_2338">
<rect width="45" height="45" fill="white"/>
</clipPath>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-8',
    label: 'Stage Logo 8',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="6" y="10" width="33" height="25" rx="1" stroke="url(#paint0_linear_527_2346)" stroke-width="2"/>
<rect x="15" y="17" width="16" height="12" rx="1" stroke="url(#paint1_linear_527_2346)" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2346" x1="-3.31683" y1="9.52397" x2="-2.7494" y2="40.2496" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2346" x1="9.72277" y1="16.2717" x2="10.0194" y2="32.2034" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-9',
    label: 'Stage Logo 9',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_527_2360)">
<rect x="3.85" y="3.85" width="29.3" height="29.3" rx="14.65" stroke="url(#paint0_linear_527_2360)" stroke-width="1.7"/>
<rect x="7.85" y="7.85" width="21.3" height="21.3" rx="10.65" stroke="url(#paint1_linear_527_2360)" stroke-width="1.7"/>
<rect x="12.85" y="12.85" width="11.3" height="11.3" rx="5.65" stroke="url(#paint2_linear_527_2360)" stroke-width="1.7"/>
<path d="M32.0256 44V27.2727H37.6776C38.9898 27.2727 40.0625 27.5096 40.8956 27.9833C41.7341 28.4516 42.3549 29.0859 42.7578 29.8864C43.1607 30.6868 43.3622 31.5798 43.3622 32.5653C43.3622 33.5509 43.1607 34.4466 42.7578 35.2525C42.3603 36.0584 41.745 36.7009 40.9119 37.18C40.0788 37.6538 39.0116 37.8906 37.7102 37.8906H33.6591V36.0938H37.6449C38.5433 36.0938 39.2648 35.9386 39.8093 35.6282C40.3538 35.3178 40.7486 34.8986 40.9936 34.3704C41.2441 33.8368 41.3693 33.2351 41.3693 32.5653C41.3693 31.8956 41.2441 31.2966 40.9936 30.7685C40.7486 30.2403 40.3511 29.8265 39.8011 29.527C39.2512 29.2221 38.5215 29.0696 37.6122 29.0696H34.0511V44H32.0256Z" fill="url(#paint3_linear_527_2360)"/>
</g>
<defs>
<linearGradient id="paint0_linear_527_2360" x1="-4.36634" y1="3.6016" x2="-3.522" y2="38.871" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2360" x1="1.53465" y1="7.44635" x2="2.1611" y2="33.614" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint2_linear_527_2360" x1="8.91089" y1="12.2523" x2="9.26497" y2="27.0427" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint3_linear_527_2360" x1="26.4356" y1="22.5434" x2="27.8572" y2="54.3543" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<clipPath id="clip0_527_2360">
<rect width="45" height="45" fill="white"/>
</clipPath>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-10',
    label: 'Stage Logo 10',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint0_linear_526_2290)" stroke-width="2"/>
<path d="M16 14H26.2667C26.819 14 27.2667 14.4477 27.2667 15V19.0198C27.2667 19.2647 27.1768 19.5011 27.0141 19.6842L16.8667 31.1L22.3432 25.4128C22.6834 25.0595 23.2298 25.0032 23.6189 25.3017C25.485 26.7333 28.3885 29.46 29 32" stroke="url(#paint1_linear_526_2290)" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_526_2290" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_526_2290" x1="12.9109" y1="14.3493" x2="13.5894" y2="34.8176" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
  {
    id: 'stage-logo-11',
    label: 'Stage Logo 11',
    svg: `<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="37" height="37" rx="18.5" stroke="url(#paint0_linear_527_2378)" stroke-width="2"/>
<path d="M16 14H26.2667C26.819 14 27.2667 14.4477 27.2667 15V19.0198C27.2667 19.2647 27.1768 19.5011 27.0141 19.6842L16.8667 31.1L22.3432 25.4128C22.6834 25.0595 23.2298 25.0032 23.6189 25.3017C25.485 26.7333 28.3885 29.46 29 32" stroke="url(#paint1_linear_527_2378)" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_527_2378" x1="-6.26733" y1="3.75685" x2="-5.20509" y2="48.128" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
<linearGradient id="paint1_linear_527_2378" x1="12.9109" y1="14.3493" x2="13.5894" y2="34.8176" gradientUnits="userSpaceOnUse">
<stop stop-color="#436BFF"/>
<stop offset="1" stop-color="#002284"/>
</linearGradient>
</defs>
</svg>`,
  },
];

const PLAN_BOTTOM_LABELS = ['Beg', 'Mid', 'End'];

function fmtActualDate(d) {
  if (!d) return '';
  const match = String(d).trim().match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!match) return '';
  const month = Number(match[2]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!months[month - 1]) return '';
  return match[3] ? `${Number(match[3])} ${months[month - 1]}` : `${months[month - 1]} ${match[1]}`;
}

function normalizeDiscussionDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  return '';
}

function getDiscussionMonth(value) {
  const date = normalizeDiscussionDate(value);
  return date.length >= 7 ? date.slice(0, 7) : '';
}

function fmtDiscussionDateLabel(value) {
  const date = normalizeDiscussionDate(value);
  if (!date) return '';
  const match = date.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[Number(match[2]) - 1];
  if (!month) return date;
  return match[3] ? `${Number(match[3])} ${month} ${match[1]}` : `${month} ${match[1]}`;
}

function getDiscussionCutoffEndTime(value) {
  const date = normalizeDiscussionDate(value);
  const match = date.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : new Date(year, month, 0).getDate();
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return end.getTime();
}

function getSubmitVersionTime(version) {
  const time = Date.parse(version && version.submittedAt);
  return Number.isFinite(time) ? time : NaN;
}

function makeTimelineVersionValue(cutoffDate) {
  return TIMELINE_VERSION_PREFIX + normalizeDiscussionDate(cutoffDate);
}

function parseTimelineVersionValue(value) {
  const raw = String(value || '');
  return raw.startsWith(TIMELINE_VERSION_PREFIX)
    ? normalizeDiscussionDate(raw.slice(TIMELINE_VERSION_PREFIX.length))
    : '';
}

function normalizeDiscussionCutoffDates(values) {
  const list = Array.isArray(values) ? values : [];
  return [...new Set(list
    .map(item => normalizeDiscussionDate(typeof item === 'string' ? item : item && (item.date || item.discussionDate || item.cutoffDate)))
    .filter(Boolean))]
    .sort((a, b) => getDiscussionCutoffEndTime(b) - getDiscussionCutoffEndTime(a));
}

function makeSubmitVersionId(submittedAt, projectId) {
  const time = Date.parse(submittedAt);
  const safeTime = Number.isFinite(time) ? time : Date.now();
  const suffix = String(projectId || 'local').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `submit-${safeTime}-${suffix}`;
}

function normalizeSubmitVersion(version) {
  if (!version || typeof version !== 'object') return null;
  const copy = cloneState(version);
  const submittedAt = String(copy.submittedAt || '').trim();
  if (!submittedAt || !Number.isFinite(Date.parse(submittedAt))) return null;
  copy.id = String(copy.id || makeSubmitVersionId(submittedAt, copy.projectId)).trim();
  copy.submittedAt = submittedAt;
  copy.discussionDate = normalizeDiscussionDate(copy.discussionDate || (copy.state && copy.state.discussionDate));
  return copy;
}

function normalizeSubmitVersions(versions) {
  return (Array.isArray(versions) ? versions : [])
    .map(normalizeSubmitVersion)
    .filter(Boolean)
    .sort((a, b) => getSubmitVersionTime(b) - getSubmitVersionTime(a) || String(b.id).localeCompare(String(a.id)));
}

function resolveSubmitVersionForCutoff(versions, cutoffDate) {
  const cutoffEnd = getDiscussionCutoffEndTime(cutoffDate);
  if (!Number.isFinite(cutoffEnd)) return null;
  return normalizeSubmitVersions(versions)
    .filter(version => getSubmitVersionTime(version) <= cutoffEnd)
    .sort((a, b) => getSubmitVersionTime(b) - getSubmitVersionTime(a) || String(b.id).localeCompare(String(a.id)))[0] || null;
}

function buildTimelineVersionOptions(cutoffDates, versions) {
  const dates = normalizeDiscussionCutoffDates(cutoffDates);
  return [
    { value: TIMELINE_VERSION_CURRENT, type: 'current', label: 'Current', disabled: false },
    ...dates.map(cutoffDate => {
      const version = resolveSubmitVersionForCutoff(versions, cutoffDate);
      return {
        value: makeTimelineVersionValue(cutoffDate),
        type: 'snapshot',
        cutoffDate,
        label: fmtDiscussionDateLabel(cutoffDate),
        disabled: !version,
        versionId: version ? version.id : '',
        submittedAt: version ? version.submittedAt : '',
      };
    }),
  ];
}

function createSubmitVersionRecord(state, payload, submittedAt = new Date().toISOString(), id) {
  const persistedState = normalizeStateForPersistence(state);
  return {
    id: id || makeSubmitVersionId(submittedAt, persistedState.projectId),
    projectId: persistedState.projectId || '',
    submittedAt,
    discussionDate: normalizeDiscussionDate(persistedState.discussionDate),
    state: persistedState,
    payload: payload ? cloneState(payload) : createDataversePayload(persistedState),
  };
}

function mergeSubmitVersions(existing, incoming) {
  const versions = normalizeSubmitVersions(existing);
  const next = normalizeSubmitVersion(incoming);
  if (!next) return versions;
  const byId = new Map(versions.map(version => [version.id, version]));
  byId.set(next.id, next);
  return normalizeSubmitVersions([...byId.values()]);
}

function stableStringify(value) {
  function sortVal(val) {
    if (Array.isArray(val)) return val.map(sortVal);
    if (!val || typeof val !== 'object') return val;
    return Object.keys(val).sort().reduce((acc, k) => { acc[k] = sortVal(val[k]); return acc; }, {});
  }
  return JSON.stringify(sortVal(value));
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function getDefaultStageIconId() {
  return (STAGE_ICONS[0] && STAGE_ICONS[0].id) || 'square';
}

function getStageIcon(iconId) {
  const id = String(iconId || '').trim();
  return STAGE_ICONS.find(icon => icon.id === id) || null;
}

function isLegacyStageIconId(iconId) {
  return iconId === 'square' || iconId === 'circle';
}

function normalizeStageIconId(iconId) {
  const id = String(iconId || '').trim();
  if (isLegacyStageIconId(id)) return id;
  return getStageIcon(id) ? id : getDefaultStageIconId();
}

function makeStageIconSvg(icon, instanceId) {
  if (!icon || !icon.svg) return '';
  const suffix = String(instanceId || icon.id).replace(/[^a-zA-Z0-9_-]/g, '-');
  return icon.svg
    .replace(/\sid="([^"]+)"/g, (_, id) => ` id="${id}-${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}-${suffix})`);
}

function getStageVisualMarkup(iconId, instanceId = 'stage-node') {
  const id = normalizeStageIconId(iconId);
  const icon = getStageIcon(id);
  if (icon) {
    return `<div class="node-shape stage-icon-node" data-stage-icon="${escapeHtml(id)}" aria-label="${escapeHtml(icon.label)}">${makeStageIconSvg(icon, instanceId)}</div>`;
  }
  const legacy = id === 'circle' ? 'circle' : 'square';
  const label = legacy === 'circle' ? 'Legacy Circle' : 'Legacy Square';
  return `<div class="node-shape legacy-node-shape ${legacy}" data-stage-icon="${legacy}" aria-label="${label}"></div>`;
}

// ════════════════════════════════════════════════════════════════
// § 2  STORE  ─  Zustand-style reactive store
// ════════════════════════════════════════════════════════════════

function createStore(initializer) {
  let state;
  const listeners = new Set();

  const set = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = Object.assign({}, state, next);
    listeners.forEach(fn => fn(state));
  };

  const get = () => state;

  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };

  state = initializer(set, get);
  return { getState: get, setState: set, subscribe };
}

const INITIAL_DATA = {
  projectId: '',
  info: { project: 'Swift Facelift 2024', location: 'SMG', plant: 'Plant-C', type: 'MC', status: 'Delayed', published: false },
  variants: [],
  planNodes: [],
  actualNodes: [],
  branches: [],
  actualBranches: [],
  branchNodes: [],
  actualBranchNodes: [],
  mergeLinks: [],
  actualMergeLinks: [],
  stageShifts: [],
  leftTable: { cols: ['Milestone', 'DOM Gas', 'DOM CNG'], rows: [['DA', '', ''], ['SOS', '', '']] },
  rightTable: { cols: ['Model Detail', 'Date- month/year'], rows: [['', '']] },
  remarks: '',
  years: [2024, 2025],
  eopDate: '',
  eopItems: [],
  discussionDate: '2024-09',
  milestoneTableVisible: false,
  labelPositions: {},
  remarkPosition: null,
  nid: 1,
};

const store = createStore((set, get) => ({
  ...cloneState(INITIAL_DATA),

  // ── Project meta ──
  setProjectId: (id) => set({ projectId: id }),
  setInfo: (partial) => set(s => ({ info: { ...s.info, ...partial } })),
  setPublished: (val) => set(s => ({ info: { ...s.info, published: val } })),

  // ── Timeline ──
  setEopDate: (date) => set({ eopDate: date }),
  setEopItems: (items) => set({ eopItems: items || [] }),
  addYear: () => set(s => ({ years: [...s.years, s.years[s.years.length - 1] + 1] })),
  ensureYearVisible: (date) => {
    const match = String(date || '').trim().match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
    if (!match) return;
    const target = Number(match[1]);
    set(s => {
      if (s.years[s.years.length - 1] >= target) return {};
      const years = [...s.years];
      while (years[years.length - 1] < target) years.push(years[years.length - 1] + 1);
      return { years };
    });
  },

  // ── Remarks + layout ──
  setRemarks: (text) => set({ remarks: text }),
  setRemarkPosition: (pos) => set({ remarkPosition: pos }),
  setLabelPosition: (key, pos) => set(s => ({ labelPositions: { ...s.labelPositions, [key]: pos } })),
  showMilestoneTable: () => set({ milestoneTableVisible: true }),

  // ── Variants ──
  addVariant: (name) => set(s => ({
    variants: [...s.variants, { id: 'i' + s.nid, name }],
    nid: s.nid + 1,
  })),
  deleteVariant: (id) => set(s => {
    const bids = new Set(s.branches.filter(b => b.variantId === id).map(b => b.id));
    const abids = new Set((s.actualBranches || []).filter(b => b.variantId === id).map(b => b.id));
    const remainingPlanIds = new Set(s.planNodes.filter(n => n.variantId !== id).map(n => n.id));
    const removedNodeIds = new Set([
      ...s.planNodes.filter(n => n.variantId === id).map(n => n.id),
      ...s.actualNodes.filter(n => n.variantId === id).map(n => n.id),
      ...s.branchNodes.filter(n => bids.has(n.branchId)).map(n => n.id),
      ...s.actualBranchNodes.filter(n => abids.has(n.branchId)).map(n => n.id),
    ]);
    return {
      variants: s.variants.filter(v => v.id !== id),
      planNodes: s.planNodes.filter(n => n.variantId !== id),
      actualNodes: s.actualNodes.filter(n => n.variantId !== id),
      branches: s.branches.filter(b => b.variantId !== id),
      actualBranches: (s.actualBranches || []).filter(b => b.variantId !== id),
      branchNodes: s.branchNodes.filter(n => !bids.has(n.branchId)),
      actualBranchNodes: s.actualBranchNodes.filter(n => !abids.has(n.branchId)),
      mergeLinks: s.mergeLinks.filter(l => !bids.has(l.fromBranchId) && (!l.toNodeId || remainingPlanIds.has(l.toNodeId))),
      actualMergeLinks: (s.actualMergeLinks || []).filter(l => !abids.has(l.fromBranchId)),
      stageShifts: s.stageShifts.filter(shift => !removedNodeIds.has(shift.sourceNodeId)),
    };
  }),

  // ── Plan nodes ──
  addPlanNode: (data) => set(s => ({
    planNodes: [...s.planNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removePlanNode: (id) => set(s => ({ planNodes: s.planNodes.filter(n => n.id !== id), ...removeStageShiftsForNodeData(s, id) })),
  movePlanNode: (id, col) => set(s => ({ planNodes: s.planNodes.map(n => n.id === id ? moveStageNodeToCol(n, 'plan', col, s) : n) })),
  updatePlanNode: (id, data) => set(s => {
    const next = updateStageNodeData(s, 'plan', id, data);
    if (next.ok === false) return {};
    const { ok, reason, ...patch } = next;
    return patch;
  }),

  // ── Actual nodes ──
  addActualNode: (data) => set(s => ({
    actualNodes: [...s.actualNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualNode: (id) => set(s => ({ actualNodes: s.actualNodes.filter(n => n.id !== id), ...removeStageShiftsForNodeData(s, id) })),
  moveActualNode: (id, col) => set(s => ({ actualNodes: s.actualNodes.map(n => n.id === id ? moveStageNodeToCol(n, 'actual', col, s) : n) })),
  updateActualNode: (id, data) => set(s => {
    const next = updateStageNodeData(s, 'actual', id, data);
    if (next.ok === false) return {};
    const { ok, reason, ...patch } = next;
    return patch;
  }),

  // ── Branch nodes ──
  addBranchNode: (data) => set(s => ({
    branchNodes: [...s.branchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    mergeLinks: s.mergeLinks.filter(l => l.fromBranchId !== data.branchId),
    nid: s.nid + 1,
  })),
  removeBranchNode: (id) => set(s => removeBranchNodeData(s, id)),
  moveBranchNode: (id, col) => set(s => ({ branchNodes: s.branchNodes.map(n => n.id === id ? moveStageNodeToCol(n, 'branch', col, s) : n) })),
  updateBranchNode: (id, data) => set(s => {
    const next = updateStageNodeData(s, 'branch', id, data);
    if (next.ok === false) return {};
    const { ok, reason, ...patch } = next;
    return patch;
  }),

  // ── Actual branch nodes ──
  addActualBranchNode: (data) => set(s => ({
    actualBranchNodes: [...s.actualBranchNodes, { id: 'i' + s.nid, isDRS: false, drsDetail: '', ...data }],
    nid: s.nid + 1,
  })),
  removeActualBranchNode: (id) => set(s => removeActualBranchNodeData(s, id)),
  moveActualBranchNode: (id, col) => set(s => ({ actualBranchNodes: s.actualBranchNodes.map(n => n.id === id ? moveStageNodeToCol(n, 'actualBranch', col, s) : n) })),
  updateActualBranchNode: (id, data) => set(s => {
    const next = updateStageNodeData(s, 'actualBranch', id, data);
    if (next.ok === false) return {};
    const { ok, reason, ...patch } = next;
    return patch;
  }),

  // ── Branches ──
  addBranch: (data) => set(s => {
    const branch = { id: 'i' + s.nid, ...data };
    const insertAt = s.branches.reduce((idx, b, i) => b.variantId === data.variantId ? i + 1 : idx, s.branches.length);
    const branches = [...s.branches];
    branches.splice(insertAt, 0, branch);
    return { branches, nid: s.nid + 1 };
  }),
  removeBranch: (branchId) => set(s => removeBranchData(s, branchId)),

  // ── Actual branches ──
  addActualBranch: (data) => set(s => {
    const branch = { id: 'i' + s.nid, ...data };
    const insertAt = (s.actualBranches || []).reduce((idx, b, i) => b.variantId === data.variantId ? i + 1 : idx, (s.actualBranches || []).length);
    const actualBranches = [...(s.actualBranches || [])];
    actualBranches.splice(insertAt, 0, branch);
    return { actualBranches, nid: s.nid + 1 };
  }),
  removeActualBranch: (branchId) => set(s => removeActualBranchData(s, branchId)),

  copyPlanToActual: () => set(s => copyPlanToActualData(s)),

  // ── Merge links ──
  addMergeLink: (data) => set(s => ({
    mergeLinks: [
      ...s.mergeLinks.filter(l => l.fromNodeId !== data.fromNodeId),
      { id: 'i' + s.nid, ...data },
    ],
    nid: s.nid + 1,
  })),
  removeMergeLinksForNode: (nodeId) => set(s => ({
    mergeLinks: s.mergeLinks.filter(l => l.fromNodeId !== nodeId && l.toNodeId !== nodeId),
  })),
  removeMergeLinksForBranch: (branchId) => set(s => ({
    mergeLinks: s.mergeLinks.filter(l => l.fromBranchId !== branchId),
  })),

  // ── Actual merge links ──
  addActualMergeLink: (data) => set(s => ({
    actualMergeLinks: [
      ...(s.actualMergeLinks || []).filter(l => l.fromNodeId !== data.fromNodeId),
      { id: 'i' + s.nid, ...data },
    ],
    nid: s.nid + 1,
  })),
  removeActualMergeLinksForNode: (nodeId) => set(s => ({
    actualMergeLinks: (s.actualMergeLinks || []).filter(l => l.fromNodeId !== nodeId && l.toNodeId !== nodeId),
  })),
  removeActualMergeLinksForBranch: (branchId) => set(s => ({
    actualMergeLinks: (s.actualMergeLinks || []).filter(l => l.fromBranchId !== branchId),
  })),

  // ── Preponed / postponed stage markers ──
  addStageShift: (data) => set(s => addStageShiftData(s, data)),

  // ── Left (Milestone) table ──
  updateLeftTableCell: (ri, ci, v) => set(s => ({
    leftTable: { ...s.leftTable, rows: s.leftTable.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r) },
  })),
  updateLeftTableColName: (ci, name) => set(s => ({
    leftTable: { ...s.leftTable, cols: s.leftTable.cols.map((c, i) => i === ci ? name : c) },
  })),
  addLeftTableRow: () => set(s => ({
    leftTable: { ...s.leftTable, rows: [...s.leftTable.rows, Array(s.leftTable.cols.length).fill('')] },
  })),
  addLeftTableCol: () => set(s => ({
    leftTable: { cols: [...s.leftTable.cols, 'New Col'], rows: s.leftTable.rows.map(r => [...r, '']) },
  })),
  deleteLeftTableRow: (ri) => set(s => ({
    leftTable: { ...s.leftTable, rows: s.leftTable.rows.filter((_, i) => i !== ri) },
  })),
  deleteLeftTableCol: (ci) => set(s => ({
    leftTable: {
      cols: s.leftTable.cols.filter((_, i) => i !== ci),
      rows: s.leftTable.rows.map(r => r.filter((_, i) => i !== ci)),
    },
  })),

  // ── Right (EOP) table ──
  updateRightTableCell: (ri, ci, v) => set(s => ({
    rightTable: { ...s.rightTable, rows: s.rightTable.rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r) },
  })),
  updateRightTableColName: (ci, name) => set(s => ({
    rightTable: { ...s.rightTable, cols: s.rightTable.cols.map((c, i) => i === ci ? name : c) },
  })),
  addRightTableRow: () => set(s => ({
    rightTable: { ...s.rightTable, rows: [...s.rightTable.rows, Array(s.rightTable.cols.length).fill('')] },
  })),
  addRightTableCol: () => set(s => ({
    rightTable: { cols: [...s.rightTable.cols, 'New Col'], rows: s.rightTable.rows.map(r => [...r, '']) },
  })),
  deleteRightTableRow: (ri) => set(s => ({
    rightTable: { ...s.rightTable, rows: s.rightTable.rows.filter((_, i) => i !== ri) },
  })),
  deleteRightTableCol: (ci) => set(s => ({
    rightTable: {
      cols: s.rightTable.cols.filter((_, i) => i !== ci),
      rows: s.rightTable.rows.map(r => r.filter((_, i) => i !== ci)),
    },
  })),

  // ── Full state replacement (used by persistence layer) ──
  replaceState: (nextState) => set(() => ({
    ...cloneState(INITIAL_DATA),
    ...cloneState(nextState),
    info: { ...INITIAL_DATA.info, ...(nextState.info || {}) },
    leftTable: nextState.leftTable ? cloneState(nextState.leftTable) : cloneState(INITIAL_DATA.leftTable),
    rightTable: nextState.rightTable ? cloneState(nextState.rightTable) : cloneState(INITIAL_DATA.rightTable),
    variants: nextState.variants || [],
    planNodes: nextState.planNodes || [],
    actualNodes: nextState.actualNodes || [],
    branches: nextState.branches || [],
    actualBranches: nextState.actualBranches || ((nextState.actualBranchNodes || []).length
      ? (nextState.branches || []).map(b => ({ ...b, sourcePlanBranchId: b.id }))
      : []),
    branchNodes: nextState.branchNodes || [],
    actualBranchNodes: nextState.actualBranchNodes || [],
    mergeLinks: nextState.mergeLinks || [],
    actualMergeLinks: nextState.actualMergeLinks || [],
    stageShifts: nextState.stageShifts || [],
    years: nextState.years ? cloneState(nextState.years) : cloneState(INITIAL_DATA.years),
    labelPositions: nextState.labelPositions || {},
    eopDate: nextState.eopDate || '',
    eopItems: nextState.eopItems || [],
    discussionDate: nextState.discussionDate || INITIAL_DATA.discussionDate,
    milestoneTableVisible: !!nextState.milestoneTableVisible,
    remarks: nextState.remarks || '',
    remarkPosition: nextState.remarkPosition || null,
  })),
}));

// ════════════════════════════════════════════════════════════════
// § 3  DOMAIN  ─  pure functions (no DOM, no store mutations)
// ════════════════════════════════════════════════════════════════

const totalCols = (state) => state.years.length * 12;
const hasEopLane = (state) => !!state.eopDate || !!(state.eopItems && state.eopItems.length);
const getTopOffset = (state) => hasEopLane(state) ? ROH : 0;

function getBranchesForVariant(state, variantId) {
  return state.branches.filter(b => b.variantId === variantId);
}

function getActualBranchesForVariant(state, variantId) {
  return (state.actualBranches || []).filter(b => b.variantId === variantId);
}

function getPlanLanes(state) {
  return state.variants.flatMap(v => [
    { type: 'plan', variantId: v.id, label: v.name },
    ...getBranchesForVariant(state, v.id).map(b => ({
      type: 'branch', branchId: b.id, variantId: v.id, label: b.label,
    })),
  ]);
}

function getActualLanes(state) {
  return state.variants.flatMap(v => [
    { type: 'actual', variantId: v.id, label: v.name },
    ...getActualBranchesForVariant(state, v.id).map(b => ({
      type: 'actualBranch', branchId: b.id, variantId: v.id, label: b.label,
    })),
  ]);
}

function findPlanLaneIndex(state, type, id) {
  return getPlanLanes(state).findIndex(l =>
    type === 'plan' ? l.variantId === id && l.type === 'plan' : l.branchId === id && l.type === 'branch'
  );
}

function findActualLaneIndex(state, type, id) {
  return getActualLanes(state).findIndex(l =>
    type === 'actual' ? l.variantId === id && l.type === 'actual' : l.branchId === id && l.type === 'actualBranch'
  );
}

const getDividerH = (state) => state.variants.length ? 4 : 0;
const TIMELINE_INLANE_OVERLAY_H = 190;

function getTimelineLaneKey(context, id) {
  return `${context}:${id || ''}`;
}

function getPlanLaneKey(lane) {
  return lane && lane.type === 'branch'
    ? getTimelineLaneKey('branch', lane.branchId)
    : getTimelineLaneKey('plan', lane && lane.variantId);
}

function getActualLaneKey(lane) {
  return lane && lane.type === 'actualBranch'
    ? getTimelineLaneKey('actualBranch', lane.branchId)
    : getTimelineLaneKey('actual', lane && lane.variantId);
}

function getPrimarySummaryLaneKey(state) {
  const planLane = getPlanLanes(state)[0];
  if (planLane) return getPlanLaneKey(planLane);
  const actualLane = getActualLanes(state)[0];
  if (actualLane) return getActualLaneKey(actualLane);
  return '';
}

function splitTimelineSummaryLines(value) {
  return String(value || '')
    .split(/[\r\n\u2028\u2029]+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function getStageDrsSummaryLabel(state, rType, node) {
  const owner = rType === 'plan' || rType === 'actual'
    ? ((state.variants || []).find(v => v.id === (node && node.variantId)) || {}).name
    : ((rType === 'actualBranch' ? (state.actualBranches || []) : (state.branches || [])).find(b => b.id === (node && node.branchId)) || {}).label;
  const name = (node && (node.topLabel || node.bottomLabel || node.date || node.id)) || '';
  const context = rType === 'branch' ? 'Branch Plan' : rType === 'actualBranch' ? 'Branch Actual' : rType === 'actual' ? 'Actual' : 'Plan';
  return [context, owner, name].filter(Boolean).join(' / ');
}

function getDrsLaneKey(rType, node) {
  if (rType === 'branch') return getTimelineLaneKey('branch', node && node.branchId);
  if (rType === 'actual') return getTimelineLaneKey('actual', node && node.variantId);
  if (rType === 'actualBranch') return getTimelineLaneKey('actualBranch', node && node.branchId);
  return getTimelineLaneKey('plan', node && node.variantId);
}

function findStageByContextData(state, context, nodeId) {
  const map = {
    plan: (state && state.planNodes) || [],
    actual: (state && state.actualNodes) || [],
    branch: (state && state.branchNodes) || [],
    actualBranch: (state && state.actualBranchNodes) || [],
  };
  return (map[context] || []).find(n => n.id === nodeId) || null;
}

function collectDrsSummaryItemsByLane(state) {
  const byLane = {};
  [
    ['plan', (state && state.planNodes) || []],
    ['branch', (state && state.branchNodes) || []],
    ['actual', (state && state.actualNodes) || []],
    ['actualBranch', (state && state.actualBranchNodes) || []],
  ].forEach(([rType, nodes]) => {
    nodes.forEach(node => {
      const text = String((node && node.drsDetail) || '').trim();
      if (!node || !node.isDRS || !text) return;
      const laneKey = getDrsLaneKey(rType, node);
      if (!laneKey) return;
      if (!byLane[laneKey]) byLane[laneKey] = [];
      byLane[laneKey].push({ label: getStageDrsSummaryLabel(state, rType, node), text });
    });
  });
  ((state && state.stageShifts) || []).forEach(shift => {
    const text = String((shift && shift.drsDetail) || '').trim();
    if (!text) return;
    const source = findStageByContextData(state, shift.sourceContext, shift.sourceNodeId);
    const laneKey = source ? getDrsLaneKey(shift.sourceContext, source) : getPrimarySummaryLaneKey(state);
    if (!laneKey) return;
    const mode = shift.mode === 'preponed' ? 'Preponed Shift' : 'Postponed Shift';
    const label = source
      ? [mode, getStageDrsSummaryLabel(state, shift.sourceContext, source)].filter(Boolean).join(' / ')
      : mode;
    if (!byLane[laneKey]) byLane[laneKey] = [];
    byLane[laneKey].push({ label, text });
  });
  return byLane;
}

function getTimelineInLaneOverlays(state) {
  const overlays = [];
  const primaryLaneKey = getPrimarySummaryLaneKey(state);
  const remarkItems = splitTimelineSummaryLines((state && state.remarks) || '').map(text => ({ text }));
  if (primaryLaneKey && remarkItems.length) {
    overlays.push({ type: 'remarks', title: 'Remarks', laneKey: primaryLaneKey, className: 'canvas-remark remarks-summary-box', items: remarkItems });
  }

  const drsByLane = collectDrsSummaryItemsByLane(state || {});
  Object.keys(drsByLane).forEach(laneKey => {
    if (drsByLane[laneKey].length) overlays.push({ type: 'drs', title: 'DRS Details', laneKey, className: 'drs-summary-box', items: drsByLane[laneKey] });
  });

  if (primaryLaneKey && state && state.milestoneTableVisible) {
    const data = getMilestoneTableRows(state);
    if (data.cols.length && data.rows.length) overlays.push({ type: 'milestone', title: 'Milestone Table', laneKey: primaryLaneKey, className: 'milestone-grid-table', table: data });
  }
  return overlays;
}

function getTimelineLaneOverlayH(state, laneKey) {
  return getTimelineInLaneOverlays(state).some(overlay => overlay.laneKey === laneKey) ? TIMELINE_INLANE_OVERLAY_H : 0;
}

function getPlanLaneH(state, lane) {
  return ROH + getTimelineLaneOverlayH(state, getPlanLaneKey(lane));
}

function getActualLaneH(state, lane) {
  return ROH + getTimelineLaneOverlayH(state, getActualLaneKey(lane));
}

const getPlannedH = (state) => getPlanLanes(state).reduce((sum, lane) => sum + getPlanLaneH(state, lane), 0);
const getActualH = (state) => getActualLanes(state).reduce((sum, lane) => sum + getActualLaneH(state, lane), 0);

function getPlanLaneGeometry(state, type, id) {
  let top = getTopOffset(state);
  const targetContext = type === 'branch' ? 'branch' : 'plan';
  const targetKey = getTimelineLaneKey(targetContext, id);
  for (const lane of getPlanLanes(state)) {
    const key = getPlanLaneKey(lane);
    const height = getPlanLaneH(state, lane);
    if (key === targetKey) return { key, top, height, stageY: top + ROH / 2, overlayTop: top + ROH, overlayH: height - ROH };
    top += height;
  }
  return null;
}

function getActualLaneGeometry(state, type, id) {
  let top = getTopOffset(state) + getPlannedH(state) + getDividerH(state);
  const targetContext = type === 'branch' ? 'actualBranch' : 'actual';
  const targetKey = getTimelineLaneKey(targetContext, id);
  for (const lane of getActualLanes(state)) {
    const key = getActualLaneKey(lane);
    const height = getActualLaneH(state, lane);
    if (key === targetKey) return { key, top, height, stageY: top + ROH / 2, overlayTop: top + ROH, overlayH: height - ROH };
    top += height;
  }
  return null;
}

const getGridGroupH = (state) => getTopOffset(state) + getPlannedH(state) + getDividerH(state) + getActualH(state);
const getSidebarH = (state) => getGridGroupH(state);

function dateToCol(date, state) {
  if (!date) return -1;
  const match = String(date).trim().match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const yearIndex = state.years.indexOf(year);
  if (yearIndex < 0 || month < 1 || month > 12) return -1;
  return yearIndex * 12 + month - 1;
}

function colToInputMonth(col, state) {
  if (!Number.isFinite(col) || col < 0 || !state.years.length) return '';
  const startYear = Number(state.years[0]);
  const year = startYear + Math.floor(col / 12);
  const month = (col % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function colToInputDate(col, state) {
  const month = colToInputMonth(col, state);
  return month ? `${month}-01` : '';
}

function getInputDateFromToday(today = new Date()) {
  const d = today instanceof Date ? today : new Date(today);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getNextMonthInputMonth(today = new Date()) {
  const d = today instanceof Date ? today : new Date(today);
  if (Number.isNaN(d.getTime())) return '';
  const monthIndex = d.getMonth() + 1;
  const year = d.getFullYear() + (monthIndex > 11 ? 1 : 0);
  const month = (monthIndex % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function isActualDateInFuture(value, today = new Date()) {
  if (!isFullActualDate(value)) return false;
  const todayValue = getInputDateFromToday(today);
  return !!todayValue && String(value).trim() > todayValue;
}

function getFutureActualBlankSpaceCol(state, today = new Date()) {
  const month = getNextMonthInputMonth(today);
  const visibleCol = dateToCol(month, state);
  if (visibleCol >= 0) return visibleCol;
  if (!month || !state.years.length) return 0;
  const [year, monthValue] = month.split('-').map(Number);
  return Math.max(0, (year - Number(state.years[0])) * 12 + monthValue - 1);
}

function getFutureActualBlankSpacePoint(state, today = new Date(), yOffset = 18) {
  const col = getFutureActualBlankSpaceCol(state, today);
  const lane = getActualLanes(state)[0];
  const geom = lane ? getActualLaneGeometry(state, lane.type === 'actualBranch' ? 'branch' : 'actual', lane.type === 'actualBranch' ? lane.branchId : lane.variantId) : null;
  return {
    x: col * COL + COL / 2,
    y: (geom ? geom.stageY : getTopOffset(state) + getPlannedH(state) + getDividerH(state) + ROH / 2) + yOffset,
  };
}

function needsFutureActualBlankSpace(state) {
  if (state.remarks || state.milestoneTableVisible) return true;
  const nodeHasDrs = node => node && node.isDRS && String(node.drsDetail || '').trim();
  return [
    ...(state.planNodes || []),
    ...(state.branchNodes || []),
    ...(state.actualNodes || []),
    ...(state.actualBranchNodes || []),
  ].some(nodeHasDrs) || (state.stageShifts || []).some(shift => String(shift.drsDetail || '').trim());
}

function ensureFutureActualBlankSpaceVisible(state) {
  if (!needsFutureActualBlankSpace(state)) return state;
  const month = getNextMonthInputMonth();
  if (!month || dateToCol(month, state) >= 0) return state;
  const liveState = store.getState();
  if (liveState && typeof liveState.ensureYearVisible === 'function') {
    liveState.ensureYearVisible(`${month}-01`);
    return store.getState();
  }
  return state;
}

function getStageSlotRatio(node, rType) {
  if (!isPlanStageContext(rType)) return 0.5;
  const label = normalizePlanBottomLabel(node && node.bottomLabel);
  if (label === 'Beg') return 0.25;
  if (label === 'End') return 0.75;
  return 0.5;
}

function getStageCollectionForContext(state, rType) {
  if (rType === 'plan') return state.planNodes || [];
  if (rType === 'branch') return state.branchNodes || [];
  if (rType === 'actual') return state.actualNodes || [];
  if (rType === 'actualBranch') return state.actualBranchNodes || [];
  return [];
}

function getStageRowKey(node, rType) {
  return rType === 'plan' || rType === 'actual' ? node.variantId : node.branchId;
}

function getStageVisualX(node, rType, state) {
  if (!node || !Number.isFinite(node.col)) return 0;
  const ratio = getStageSlotRatio(node, rType);
  const rowKey = getStageRowKey(node, rType);
  const group = getStageCollectionForContext(state, rType)
    .filter(n =>
      n.col === node.col &&
      getStageRowKey(n, rType) === rowKey &&
      getStageSlotRatio(n, rType) === ratio
    )
    .sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  const index = Math.max(0, group.findIndex(n => n.id === node.id));
  const gap = 6;
  const maxOffset = Math.max(0, (group.length - 1) / 2 * gap);
  const minX = node.col * COL + 14;
  const maxX = (node.col + 1) * COL - 14;
  const baseX = Math.min(maxX - maxOffset, Math.max(minX + maxOffset, node.col * COL + COL * ratio));
  return Math.min(maxX, Math.max(minX, baseX + (index - (group.length - 1) / 2) * gap));
}

function isPlanStageContext(rType) {
  return rType === 'plan' || rType === 'branch';
}

function isActualStageContext(rType) {
  return rType === 'actual' || rType === 'actualBranch';
}

function normalizePlanBottomLabel(value) {
  const label = String(value || '').trim();
  return PLAN_BOTTOM_LABELS.includes(label) ? label : '';
}

function isFullActualDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function prepareStageNodeData(state, rType, currentCol, data, existing) {
  const date = String(data.date || '').trim();
  if (isActualStageContext(rType) && !isFullActualDate(date)) {
    return { ok: false, reason: 'Enter the actual date.' };
  }
  if (isActualStageContext(rType) && isActualDateInFuture(date)) {
    return { ok: false, reason: 'Actual date cannot be in the future.' };
  }
  if (date && isPlanStageContext(rType) && !/^\d{4}-\d{2}$/.test(date)) {
    return { ok: false, reason: 'Select a valid month.' };
  }

  const col = date ? dateToCol(date, state) : currentCol;
  if (!Number.isFinite(col) || col < 0) {
    return { ok: false, reason: 'Selected date is outside the visible timeline.' };
  }
  const branchValidation = canPlaceBranchStageAtCol(state, rType, (data && data.branchId) || (existing && existing.branchId), col);
  if (!branchValidation.ok) return branchValidation;

  return {
    ok: true,
    reason: '',
    node: {
      col,
      type: normalizeStageIconId(data.type || (existing && existing.type)),
      topLabel: String(data.topLabel || '').trim(),
      bottomLabel: isPlanStageContext(rType) ? normalizePlanBottomLabel(data.bottomLabel) : '',
      date,
      isDRS: !!data.isDRS,
      drsDetail: data.isDRS ? String(data.drsDetail || '').trim() : '',
    },
  };
}

function createStageNodeData(state, rType, clickedCol, data, branchId) {
  return prepareStageNodeData(state, rType, clickedCol, { ...(data || {}), branchId }, null);
}

function updateStageNodeData(state, rType, nodeId, data) {
  const keys = {
    plan: 'planNodes',
    actual: 'actualNodes',
    branch: 'branchNodes',
    actualBranch: 'actualBranchNodes',
  };
  const key = keys[rType];
  const nodes = (state[key] || []);
  const existing = nodes.find(n => n.id === nodeId);
  if (!key || !existing) return { ok: false, reason: 'Stage not found.' };

  const prepared = prepareStageNodeData(state, rType, existing.col, { ...existing, ...(data || {}) }, existing);
  if (!prepared.ok) return prepared;
  const updated = { ...existing, ...prepared.node };
  return {
    ok: true,
    reason: '',
    planNodes: rType === 'plan' ? nodes.map(n => n.id === nodeId ? updated : n) : (state.planNodes || []),
    actualNodes: rType === 'actual' ? nodes.map(n => n.id === nodeId ? updated : n) : (state.actualNodes || []),
    branchNodes: rType === 'branch' ? nodes.map(n => n.id === nodeId ? updated : n) : (state.branchNodes || []),
    actualBranchNodes: rType === 'actualBranch' ? nodes.map(n => n.id === nodeId ? updated : n) : (state.actualBranchNodes || []),
  };
}

function getBranchStartCol(state, rType, branchId) {
  if (!branchId || (rType !== 'branch' && rType !== 'actualBranch')) return null;
  const branches = rType === 'actualBranch' ? (state.actualBranches || []) : (state.branches || []);
  const branch = branches.find(b => b.id === branchId);
  if (!branch) return null;
  if (Number.isFinite(branch.sourceCol)) return branch.sourceCol;
  const col = dateToCol(branch.sourceDate, state);
  return col >= 0 ? col : null;
}

function canPlaceBranchStageAtCol(state, rType, branchId, col) {
  if (rType !== 'branch' && rType !== 'actualBranch') return { ok: true, reason: '' };
  if (!Number.isFinite(col)) return { ok: false, reason: 'Select a valid branch stage month.' };
  const startCol = getBranchStartCol(state, rType, branchId);
  if (startCol == null) return { ok: true, reason: '' };
  return col >= startCol
    ? { ok: true, reason: '' }
    : { ok: false, reason: 'Branch stages cannot be before the branch start month.' };
}

function colToDate(col, state) {
  const year = state.years[Math.floor(col / 12)];
  const month = (col % 12) + 1;
  if (!year || month < 1 || month > 12) return '';
  return `${year}-${String(month).padStart(2, '0')}`;
}

function getLastDayOfInputMonth(monthValue) {
  const match = String(monthValue || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return 1;
  return new Date(Number(match[1]), Number(match[2]), 0).getDate();
}

function getActualDateDay(value) {
  const match = String(value || '').match(/^\d{4}-\d{2}-(\d{2})$/);
  return match ? Number(match[1]) : 1;
}

function getMovedStageDate(node, rType, col, state) {
  const month = colToInputMonth(col, state);
  if (!month) return (node && node.date) || '';
  if (!isActualStageContext(rType)) return month;
  const day = Math.min(getActualDateDay(node && node.date), getLastDayOfInputMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

function moveStageNodeToCol(node, rType, col, state) {
  if (!node) return node;
  return {
    ...node,
    col,
    date: getMovedStageDate(node, rType, col, state),
  };
}

function getPdfTimelineSlice({ totalCols, colWidth, timelineWidthPx, horizontalScale = 1 }) {
  const safeTotalCols = Math.max(0, Number(totalCols) || 0);
  const safeColWidth = Math.max(1, Number(colWidth) || COL);
  const safeScale = Math.min(1, Math.max(0.5, Number(horizontalScale) || 1));
  const exportColWidth = safeColWidth * safeScale;
  const safeTimelineWidth = Math.max(exportColWidth, Number(timelineWidthPx) || exportColWidth);
  const colsPerPage = Math.max(1, Math.floor(safeTimelineWidth / exportColWidth));
  const endCol = Math.max(1, Math.min(safeTotalCols || 1, colsPerPage));
  return {
    startCol: 0,
    endCol,
    startX: 0,
    width: endCol * exportColWidth,
    exportColWidth,
    horizontalScale: safeScale,
  };
}

function getDiscussionPeriodCols(state) {
  const current = dateToCol(state.discussionDate, state);
  const maxCol = totalCols(state) - 1;
  if (current < 0 || maxCol < 0) return { prev: null, current: null, next: null };
  return {
    prev: current > 0 ? current - 1 : null,
    current,
    next: current < maxCol ? current + 1 : null,
  };
}

function getDiscussionPeriodClass(col, state) {
  const cols = getDiscussionPeriodCols(state);
  if (col === cols.current) return 'discussion-current';
  if (col === cols.prev) return 'discussion-prev';
  if (col === cols.next) return 'discussion-next';
  return '';
}

function normalizeMonthInput(raw) {
  raw = String(raw || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const monthYear = raw.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i);
  if (monthYear) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return `${monthYear[2]}-${String(months.indexOf(monthYear[1].slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}`;
  }
  const slash = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${String(Number(slash[1])).padStart(2, '0')}`;
  return '';
}

function parseEopItems(state, today = new Date()) {
  const table = state.rightTable || { cols: [], rows: [] };
  const dateCols = (table.cols || [])
    .map((col, index) => (/date|month/i.test(col || '') ? index : -1))
    .filter(index => index >= 0);
  const cols = dateCols.length ? dateCols : [1];
  const inferredDate = getNextMonthInputMonth(today);
  const items = [];

  (table.rows || []).forEach((row, rowIndex) => {
    const label = String((row && row[0]) || '').trim();
    let hasDatedItem = false;
    cols.forEach(colIndex => {
      const date = normalizeMonthInput(row && row[colIndex]);
      if (!date) return;
      hasDatedItem = true;
      items.push({
        id: `eop-${rowIndex}-${colIndex}`,
        label,
        date,
        col: dateToCol(date, state),
        rowIndex,
        colIndex,
      });
    });
    if (!hasDatedItem && label && inferredDate) {
      items.push({
        id: `eop-${rowIndex}-inferred`,
        label,
        date: inferredDate,
        col: dateToCol(inferredDate, state),
        rowIndex,
        colIndex: cols[0] ?? 1,
      });
    }
  });

  return items.sort((a, b) => a.col - b.col || a.rowIndex - b.rowIndex || a.colIndex - b.colIndex);
}

function getEopItemsForState(state) {
  if (state.eopItems && state.eopItems.length) return state.eopItems;
  if (!state.eopDate) return [];
  return [{ id: 'eop-primary', label: '', date: state.eopDate, col: dateToCol(state.eopDate, state), rowIndex: 0, colIndex: 1 }];
}

function getMilestoneTableRows(state) {
  const table = state.leftTable || { cols: [], rows: [] };
  const cols = (table.cols || []).map(col => String(col || '').trim());
  const rows = (table.rows || [])
    .map(row => cols.map((_, index) => String((row && row[index]) || '').trim()))
    .filter(row => row.some(Boolean));
  return { cols, rows };
}

function getBranchSourcePoint(branch, state) {
  const sourceNodeId = branch.sourceNodeId || branch.parentNodeId;
  const sourceNode = sourceNodeId ? state.planNodes.find(n => n.id === sourceNodeId) : null;
  if (sourceNode) return getPlanNodeCenter(sourceNode, state);
  const geom = getPlanLaneGeometry(state, 'plan', branch.variantId);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function getActualBranchSourcePoint(branch, state) {
  const sourceNodeId = branch.sourceNodeId || branch.parentNodeId;
  const sourceNode = sourceNodeId ? (state.actualNodes || []).find(n => n.id === sourceNodeId) : null;
  if (sourceNode) return getActualNodeCenter(sourceNode, state);
  const geom = getActualLaneGeometry(state, 'actual', branch.variantId);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function getBranchLaneAnchorPoint(branch, state) {
  const geom = getPlanLaneGeometry(state, 'branch', branch.id);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function getActualBranchLaneAnchorPoint(branch, state) {
  const geom = getActualLaneGeometry(state, 'branch', branch.id);
  const col = Number.isFinite(branch.sourceCol) ? branch.sourceCol : dateToCol(branch.sourceDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function getMergeTargetPoint(link, state) {
  if (link.toNodeId) {
    const toNode = state.planNodes.find(n => n.id === link.toNodeId);
    if (toNode) return getPlanNodeCenter(toNode, state);
  }
  const branch = state.branches.find(b => b.id === link.fromBranchId);
  if (!branch) return null;
  const geom = getPlanLaneGeometry(state, 'plan', branch.variantId);
  const col = Number.isFinite(link.toCol) ? link.toCol : dateToCol(link.toDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function getActualMergeTargetPoint(link, state) {
  if (link.toNodeId) {
    const toNode = (state.actualNodes || []).find(n => n.id === link.toNodeId);
    if (toNode) return getActualNodeCenter(toNode, state);
  }
  const branch = (state.actualBranches || []).find(b => b.id === link.fromBranchId);
  if (!branch) return null;
  const geom = getActualLaneGeometry(state, 'actual', branch.variantId);
  const col = Number.isFinite(link.toCol) ? link.toCol : dateToCol(link.toDate, state);
  if (!geom || col < 0) return null;
  return { x: col * COL + COL / 2, y: geom.stageY };
}

function findPlanNodeAtCol(state, variantId, col) {
  return state.planNodes
    .filter(n => n.variantId === variantId && n.col === col)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] || null;
}

function findActualNodeAtCol(state, variantId, col) {
  return (state.actualNodes || [])
    .filter(n => n.variantId === variantId && n.col === col)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getInitialPlanNodeForVariant(state, variantId) {
  return (state.planNodes || [])
    .filter(n => n.variantId === variantId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getInitialNodeForVariant(state, context, variantId) {
  const nodes = context === 'actual' ? (state.actualNodes || []) : (state.planNodes || []);
  return nodes
    .filter(n => n.variantId === variantId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function canStartBranchAtColForContext(state, context, variantId, col) {
  const initial = getInitialNodeForVariant(state, context, variantId);
  return !!initial && Number.isFinite(col) && col >= initial.col;
}

function canStartBranchAtCol(state, variantId, col) {
  return canStartBranchAtColForContext(state, 'plan', variantId, col);
}

function getLastPlanNodeForVariant(state, variantId) {
  return (state.planNodes || [])
    .filter(n => n.variantId === variantId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))
    .slice(-1)[0] || null;
}

function getMergeTargetCol(link, state) {
  if (Number.isFinite(link.toCol)) return link.toCol;
  if (link.toNodeId) {
    const node = (state.planNodes || []).find(n => n.id === link.toNodeId);
    if (node) return node.col;
  }
  return dateToCol(link.toDate, state);
}

function getLastBranchNode(branchId, state) {
  return (state.branchNodes || [])
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))
    .slice(-1)[0] || null;
}

function getLastBranchNodeForContext(branchId, state, context) {
  const nodes = context === 'actualBranch' ? (state.actualBranchNodes || []) : (state.branchNodes || []);
  return nodes
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))
    .slice(-1)[0] || null;
}

function isLastBranchNodeForContext(node, state, context) {
  if (!node || !node.branchId) return false;
  const last = getLastBranchNodeForContext(node.branchId, state, context);
  return !!last && last.id === node.id;
}

function isLastBranchNode(node, state) {
  return isLastBranchNodeForContext(node, state, 'branch');
}

function getNextPlanNodeAfterBranchSource(branch, state) {
  if (!branch) return null;
  const sourceCol = Number.isFinite(branch.sourceCol)
    ? branch.sourceCol
    : dateToCol(branch.sourceDate, state);
  return (state.planNodes || [])
    .filter(n => n.variantId === branch.variantId && n.col > sourceCol)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function canMergeBranchNodeToCol(node, col, state) {
  return canMergeBranchNodeToColForContext(node, col, state, 'branch');
}

function canMergeBranchNodeToColForContext(node, col, state, context) {
  if (!isLastBranchNodeForContext(node, state, context)) {
    return { ok: false, reason: 'Only the last branch stage can merge.' };
  }
  if (!Number.isFinite(col)) {
    return { ok: false, reason: 'Select a valid merge month.' };
  }
  if (!Number.isFinite(node.col) || col <= node.col) {
    return { ok: false, reason: 'Merge month must be after the branch stage month.' };
  }
  return { ok: true, reason: '' };
}

function removeBranchData(state, branchId) {
  const removedActualBranchIds = new Set((state.actualBranches || [])
    .filter(b => b.sourcePlanBranchId === branchId || b.id === branchId)
    .map(b => b.id));
  const removedIds = new Set([
    ...(state.branchNodes || []).filter(n => n.branchId === branchId).map(n => n.id),
    ...(state.actualBranchNodes || []).filter(n => n.branchId === branchId || removedActualBranchIds.has(n.branchId)).map(n => n.id),
  ]);
  return {
    branches: (state.branches || []).filter(b => b.id !== branchId),
    branchNodes: (state.branchNodes || []).filter(n => n.branchId !== branchId),
    actualBranchNodes: (state.actualBranchNodes || []).filter(n => n.branchId !== branchId && !removedActualBranchIds.has(n.branchId)),
    mergeLinks: (state.mergeLinks || []).filter(l => l.fromBranchId !== branchId),
    stageShifts: (state.stageShifts || []).filter(shift => !removedIds.has(shift.sourceNodeId)),
    ...(state.actualBranches ? { actualBranches: state.actualBranches.filter(b => !removedActualBranchIds.has(b.id)) } : {}),
    ...(state.actualMergeLinks ? { actualMergeLinks: state.actualMergeLinks.filter(l => !removedActualBranchIds.has(l.fromBranchId)) } : {}),
  };
}

function removeActualBranchData(state, branchId) {
  const removedIds = new Set(
    (state.actualBranchNodes || []).filter(n => n.branchId === branchId).map(n => n.id)
  );
  return {
    actualBranches: (state.actualBranches || []).filter(b => b.id !== branchId),
    actualBranchNodes: (state.actualBranchNodes || []).filter(n => n.branchId !== branchId),
    actualMergeLinks: (state.actualMergeLinks || []).filter(l => l.fromBranchId !== branchId),
    stageShifts: (state.stageShifts || []).filter(shift => !removedIds.has(shift.sourceNodeId)),
  };
}

function removeBranchNodeData(state, nodeId) {
  const node = (state.branchNodes || []).find(n => n.id === nodeId);
  if (!node) return { branchNodes: state.branchNodes || [] };
  const branchNodes = (state.branchNodes || []).filter(n => n.id !== nodeId);
  const branchStillHasNodes = branchNodes.some(n => n.branchId === node.branchId);
  if (!branchStillHasNodes) {
    return removeBranchData(state, node.branchId);
  }
  return {
    branches: state.branches || [],
    branchNodes,
    actualBranchNodes: state.actualBranchNodes || [],
    mergeLinks: (state.mergeLinks || []).filter(l => l.fromNodeId !== nodeId),
    ...(state.actualBranches ? { actualBranches: state.actualBranches } : {}),
    ...(state.actualMergeLinks ? { actualMergeLinks: state.actualMergeLinks } : {}),
    ...removeStageShiftsForNodeData(state, nodeId),
  };
}

function removeActualBranchNodeData(state, nodeId) {
  const node = (state.actualBranchNodes || []).find(n => n.id === nodeId);
  if (!node) return { actualBranchNodes: state.actualBranchNodes || [] };
  const actualBranchNodes = (state.actualBranchNodes || []).filter(n => n.id !== nodeId);
  const branchStillHasNodes = actualBranchNodes.some(n => n.branchId === node.branchId);
  if (!branchStillHasNodes) {
    return removeActualBranchData(state, node.branchId);
  }
  return {
    actualBranches: state.actualBranches || [],
    actualBranchNodes,
    actualMergeLinks: (state.actualMergeLinks || []).filter(l => l.fromNodeId !== nodeId),
    ...removeStageShiftsForNodeData(state, nodeId),
  };
}

function canAddStageShift(node, mode, targetCol) {
  if (!node || !Number.isFinite(targetCol)) return { ok: false, reason: 'Select a valid month.' };
  if (mode === 'preponed') {
    return targetCol < node.col
      ? { ok: true, reason: '' }
      : { ok: false, reason: 'Preponed month must be before the selected stage.' };
  }
  if (mode === 'postponed') {
    return targetCol > node.col
      ? { ok: true, reason: '' }
      : { ok: false, reason: 'Postponed month must be after the selected stage.' };
  }
  return { ok: false, reason: 'Choose preponed or postponed.' };
}

function addStageShiftData(state, data) {
  const shift = {
    id: 'i' + (state.nid || 1),
    sourceNodeId: data.sourceNodeId,
    sourceContext: data.sourceContext,
    mode: data.mode,
    targetDate: data.targetDate,
    targetCol: data.targetCol,
    drsDetail: String(data.drsDetail || '').trim(),
  };
  return {
    stageShifts: [...(state.stageShifts || []), shift],
    nid: (state.nid || 1) + 1,
  };
}

function removeStageShiftsForNodeData(state, nodeId) {
  return {
    stageShifts: (state.stageShifts || []).filter(shift => shift.sourceNodeId !== nodeId),
  };
}

function copyStageForActual(node, id, contextKey) {
  const copy = {
    id,
    sourcePlanNodeId: node.id,
    col: node.col,
    type: normalizeStageIconId(node.type),
    topLabel: node.topLabel || '',
    bottomLabel: node.bottomLabel || '',
    date: node.date || '',
    isDRS: !!node.isDRS,
    drsDetail: node.drsDetail || '',
  };
  copy[contextKey] = node[contextKey];
  return copy;
}

function syncCopiedNodes(planNodes, actualNodes, contextKey, nextId) {
  const sourceIds = new Set(planNodes.map(n => n.id));
  const bySource = new Map(actualNodes.filter(n => n.sourcePlanNodeId).map(n => [n.sourcePlanNodeId, n]));
  const preserved = actualNodes.filter(n => !n.sourcePlanNodeId || !sourceIds.has(n.sourcePlanNodeId));
  const copied = planNodes.map(planNode => {
    const existing = bySource.get(planNode.id);
    const id = existing ? existing.id : `i${nextId.value++}`;
    return copyStageForActual(planNode, id, contextKey);
  });
  return [...preserved, ...copied];
}

function copyPlanToActualData(state) {
  const nextId = { value: state.nid || 1 };
  const actualNodes = syncCopiedNodes(state.planNodes || [], state.actualNodes || [], 'variantId', nextId);
  const planBranchIds = new Set((state.branches || []).map(b => b.id));
  const bySourceBranch = new Map((state.actualBranches || [])
    .filter(b => b.sourcePlanBranchId && planBranchIds.has(b.sourcePlanBranchId))
    .map(b => [b.sourcePlanBranchId, b]));
  const preservedActualBranches = (state.actualBranches || []).filter(b => !b.sourcePlanBranchId);
  const branchIdMap = new Map();
  const copiedActualBranches = (state.branches || []).map(branch => {
    const existing = bySourceBranch.get(branch.id);
    const id = existing ? existing.id : `i${nextId.value++}`;
    branchIdMap.set(branch.id, id);
    return {
      id,
      sourcePlanBranchId: branch.id,
      variantId: branch.variantId,
      parentNodeId: branch.parentNodeId || '',
      sourceNodeId: branch.sourceNodeId || branch.parentNodeId || '',
      sourceCol: branch.sourceCol,
      sourceDate: branch.sourceDate || '',
      label: branch.label || '',
    };
  });

  const manualActualBranchIds = new Set(preservedActualBranches.map(b => b.id));
  const preservedActualBranchNodes = (state.actualBranchNodes || []).filter(n => manualActualBranchIds.has(n.branchId));
  const bySourceNode = new Map((state.actualBranchNodes || [])
    .filter(n => n.sourcePlanNodeId)
    .map(n => [n.sourcePlanNodeId, n]));
  const copiedActualBranchNodes = (state.branchNodes || []).map(planNode => {
    const existing = bySourceNode.get(planNode.id);
    const id = existing ? existing.id : `i${nextId.value++}`;
    return copyStageForActual({ ...planNode, branchId: branchIdMap.get(planNode.branchId) }, id, 'branchId');
  });
  const preservedActualMergeLinks = (state.actualMergeLinks || []).filter(l => manualActualBranchIds.has(l.fromBranchId));

  return {
    actualNodes,
    actualBranches: [...preservedActualBranches, ...copiedActualBranches],
    actualBranchNodes: [...preservedActualBranchNodes, ...copiedActualBranchNodes],
    actualMergeLinks: preservedActualMergeLinks,
    nid: nextId.value,
  };
}

// ════════════════════════════════════════════════════════════════
// § 4  PERSISTENCE  ─  localStorage + Dataverse bridge
// ════════════════════════════════════════════════════════════════

let persistenceReady = false;
let suppressDraftSave = false;
let draftSaveTimer = null;
let submitVersions = [];
let discussionCutoffDates = [];
let snapshotView = { selected: TIMELINE_VERSION_CURRENT, state: null, cutoffDate: '', versionId: '' };

function getStorageKeys(projectId) {
  return {
    draft: `${STORAGE_PREFIX}:draft:${projectId}`,
    baseline: `${STORAGE_PREFIX}:baseline:${projectId}`,
    submitVersions: `${STORAGE_PREFIX}:submit-versions:${projectId}`,
    discussionCutoffs: `${STORAGE_PREFIX}:discussion-cutoffs:${projectId}`,
  };
}

function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Could not read local draft data:', err);
    return null;
  }
}

function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Could not write local draft data:', err);
  }
}

function removeLocalItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Could not remove local draft data:', err);
  }
}

function getOrCreateActiveProjectId() {
  try {
    const existing = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (existing) return existing;
    const next = `local-${Date.now()}`;
    localStorage.setItem(ACTIVE_PROJECT_KEY, next);
    return next;
  } catch (err) {
    console.warn('Draft storage unavailable:', err);
    return `local-${Date.now()}`;
  }
}

function getCurrentStorageKeys() {
  const { projectId } = store.getState();
  const id = projectId || getOrCreateActiveProjectId();
  return getStorageKeys(id);
}

function normalizeStateForPersistence(state) {
  const copy = cloneState(state);
  delete copy._dirty;
  delete copy._syncStatus;
  return copy;
}

function isDirty(draft, baseline) {
  return stableStringify(normalizeStateForPersistence(draft)) !== stableStringify(normalizeStateForPersistence(baseline));
}

function captureState() {
  return normalizeStateForPersistence(store.getState());
}

function getBaselineState() {
  return readLocalJson(getCurrentStorageKeys().baseline) || captureState();
}

function persistDraftNow() {
  if (!persistenceReady || suppressDraftSave) return;
  writeLocalJson(getCurrentStorageKeys().draft, captureState());
  updateDraftStatus();
}

function scheduleDraftSave() {
  if (!persistenceReady || suppressDraftSave) return;
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(persistDraftNow, 80);
}

function updateDraftStatus(message) {
  const status = $('draftStatus');
  if (!status) return;
  if (isSnapshotReadOnlyMode()) {
    status.hidden = false;
    $('draftStatusText').textContent = message || `Viewing ${getTimelineVersionLabel(snapshotView.selected)}`;
    const revert = $('revertDraftBtn');
    if (revert) revert.disabled = true;
    return;
  }
  const draft = readLocalJson(getCurrentStorageKeys().draft) || captureState();
  const baseline = getBaselineState();
  const dirty = isDirty(draft, baseline);
  status.hidden = !dirty && !message;
  $('draftStatusText').textContent = message || (dirty ? 'Draft changes' : 'Saved');
}

function syncHeaderInputsFromState(state = getTimelineRenderState()) {
  const { info, remarks } = state;
  $('fProject').value = info.project || '';
  $('fLocation').value = info.location || '';
  $('fPlant').value = info.plant || '';
  $('fProjType').value = info.type || '';
  $('fStatus').value = info.status || 'On Track';
  $('remarksBox').textContent = remarks || '';
  syncPubBtn(state);
}

function loadSample() {
  const stageLogo = getDefaultStageIconId();
  store.getState().replaceState({
    variants: [{ id: 'v1', name: 'DOM Gas' }, { id: 'v2', name: 'DOM CNG' }],
    nid: 50,
    planNodes: [
      { id: 'p1', variantId: 'v1', col: 5, type: stageLogo, topLabel: 'DA', bottomLabel: '', date: '2024-06', isDRS: false, drsDetail: '' },
      { id: 'p2', variantId: 'v1', col: 9, type: stageLogo, topLabel: 'SOS', bottomLabel: '', date: '2024-10', isDRS: false, drsDetail: '' },
      { id: 'p3', variantId: 'v2', col: 6, type: stageLogo, topLabel: 'DA', bottomLabel: '', date: '2024-07', isDRS: false, drsDetail: '' },
    ],
    actualNodes: [
      { id: 'a1', variantId: 'v1', col: 6, type: stageLogo, topLabel: '', bottomLabel: '', date: '2024-07', isDRS: false, drsDetail: '' },
    ],
  });
}

function getFallbackDiscussionCutoffs(state, versions, storedCutoffs) {
  return normalizeDiscussionCutoffDates([
    ...(Array.isArray(storedCutoffs) ? storedCutoffs : []),
    state && state.discussionDate,
    ...normalizeSubmitVersions(versions).map(version => version.discussionDate),
  ]);
}

async function loadProjectFromDataverse(projectId) {
  if (typeof window === 'undefined') return null;
  const bridge = window.ProjectTrackerDataverse;
  if (!bridge || typeof bridge.loadProject !== 'function') return null;
  return bridge.loadProject({ projectId });
}

function getLoadedProjectState(data) {
  return (data && (data.state || data.currentState || data.draft || data.projectState)) || null;
}

function getLoadedDiscussionDate(data, state) {
  return normalizeDiscussionDate(data && (
    data.currentDiscussionDate ||
    data.discussionDate ||
    data.discussionPeriodDate ||
    data.activeDiscussionPeriodDate ||
    (state && state.discussionDate)
  ));
}

function getLoadedCutoffDates(data) {
  return normalizeDiscussionCutoffDates(data && (
    data.discussionCutoffDates ||
    data.cutoffDates ||
    data.discussionPeriods ||
    data.snapshotDates
  ));
}

async function initPersistenceState() {
  const projectId = getOrCreateActiveProjectId();
  const keys = getStorageKeys(projectId);
  let loaded = null;

  try {
    loaded = await loadProjectFromDataverse(projectId);
  } catch (err) {
    console.warn('Could not load project from Dataverse bridge:', err);
  }

  if (loaded) {
    const loadedProjectId = loaded.projectId || projectId;
    const loadedState = getLoadedProjectState(loaded);
    const activeDiscussionDate = getLoadedDiscussionDate(loaded, loadedState);
    if (loadedState) {
      store.getState().replaceState({
        ...loadedState,
        ...(activeDiscussionDate ? { discussionDate: activeDiscussionDate } : {}),
        projectId: loadedProjectId,
      });
    } else {
      loadSample();
      store.getState().setProjectId(loadedProjectId);
      if (activeDiscussionDate) store.getState().replaceState({ ...captureState(), discussionDate: activeDiscussionDate });
    }
    try {
      localStorage.setItem(ACTIVE_PROJECT_KEY, loadedProjectId);
    } catch (err) {
      console.warn('Could not update active project id:', err);
    }
    const loadedKeys = getStorageKeys(loadedProjectId);
    submitVersions = normalizeSubmitVersions(loaded.submitVersions || loaded.versions || []);
    discussionCutoffDates = getLoadedCutoffDates(loaded);
    if (!discussionCutoffDates.length) {
      discussionCutoffDates = getFallbackDiscussionCutoffs(store.getState(), submitVersions, readLocalJson(loadedKeys.discussionCutoffs));
    }
    writeLocalJson(loadedKeys.submitVersions, submitVersions);
    writeLocalJson(loadedKeys.discussionCutoffs, discussionCutoffDates);
    writeLocalJson(loadedKeys.draft, captureState());
    if (!readLocalJson(loadedKeys.baseline)) writeLocalJson(loadedKeys.baseline, captureState());
    persistenceReady = true;
    return;
  }

  const draft = readLocalJson(keys.draft);
  const baseline = readLocalJson(keys.baseline);

  if (draft) {
    store.getState().replaceState({ ...draft, projectId });
  } else if (baseline) {
    store.getState().replaceState({ ...baseline, projectId });
    writeLocalJson(keys.draft, captureState());
  } else {
    loadSample();
    store.getState().setProjectId(projectId);
    const initial = captureState();
    writeLocalJson(keys.draft, initial);
    writeLocalJson(keys.baseline, initial);
  }

  if (!readLocalJson(keys.baseline)) writeLocalJson(keys.baseline, captureState());
  submitVersions = normalizeSubmitVersions(readLocalJson(keys.submitVersions) || []);
  discussionCutoffDates = getFallbackDiscussionCutoffs(store.getState(), submitVersions, readLocalJson(keys.discussionCutoffs));
  writeLocalJson(keys.submitVersions, submitVersions);
  writeLocalJson(keys.discussionCutoffs, discussionCutoffDates);
  persistenceReady = true;
}

function revertDraftToBaseline() {
  const baseline = getBaselineState();
  suppressDraftSave = true;
  store.getState().replaceState(baseline);
  const keys = getCurrentStorageKeys();
  removeLocalItem(keys.draft);
  writeLocalJson(keys.draft, captureState());
  syncHeaderInputsFromState();
  renderAll();
  suppressDraftSave = false;
  persistDraftNow();
  updateDraftStatus('Reverted');
  setTimeout(() => updateDraftStatus(), 1400);
}

function adoptProjectId(nextProjectId, snapshot) {
  const { projectId } = store.getState();
  if (!nextProjectId || nextProjectId === projectId) return snapshot;
  const oldKeys = getCurrentStorageKeys();
  const nextSnapshot = { ...snapshot, projectId: nextProjectId };
  store.getState().setProjectId(nextProjectId);
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, nextProjectId);
  } catch (err) {
    console.warn('Could not update active project id:', err);
  }
  removeLocalItem(oldKeys.draft);
  removeLocalItem(oldKeys.baseline);
  return nextSnapshot;
}

function normalizeStateForDataverse(state) {
  return normalizeStateForPersistence(state);
}

function mapStages(nodes, context, extra) {
  return (nodes || []).map((node, index) => ({
    external_id: node.id,
    stage_context: context,
    month: node.date || '',
    column_index: Number.isFinite(node.col) ? node.col : 0,
    shape: normalizeStageIconId(node.type),
    top_label: node.topLabel || '',
    bottom_label: node.bottomLabel || '',
    is_drs: !!node.isDRS,
    drs_detail: node.drsDetail || '',
    source_plan_stage_external_id: node.sourcePlanNodeId || '',
    display_order: index,
    ...extra(node),
  }));
}

function createDataversePayload(state) {
  const s = normalizeStateForDataverse(state);
  const eopItems = s.eopItems && s.eopItems.length ? s.eopItems : parseEopItems(s);
  const primaryEopDate = s.eopDate || (eopItems[0] && eopItems[0].date) || '';
  const project = {
    external_id: s.projectId || '',
    name: s.info?.project || '',
    location: s.info?.location || '',
    plant: s.info?.plant || '',
    project_type: s.info?.type || '',
    status: s.info?.status || '',
    published: !!s.info?.published,
    discussion_period_date: s.discussionDate || '',
    eop_date: primaryEopDate,
    eop_dates_json: JSON.stringify(eopItems || []),
    stage_shifts_json: JSON.stringify(s.stageShifts || []),
    years_json: JSON.stringify(s.years || []),
    remarks: s.remarks || '',
    milestone_table_json: JSON.stringify(s.leftTable || { cols: [], rows: [] }),
    eop_table_json: JSON.stringify(s.rightTable || { cols: [], rows: [] }),
    layout_json: JSON.stringify({
      labelPositions: s.labelPositions || {},
      remarkPosition: s.remarkPosition || null,
      nid: s.nid || 1,
    }),
  };

  return {
    project,
    variants: (s.variants || []).map((v, i) => ({ external_id: v.id, name: v.name || '', display_order: i })),
    branches: [
      ...(s.branches || []).map((b, i) => ({
      external_id: b.id,
      branch_context: 'plan',
      variant_external_id: b.variantId,
      parent_stage_external_id: b.parentNodeId || b.sourceNodeId || '',
      source_stage_external_id: b.sourceNodeId || b.parentNodeId || '',
      source_month: b.sourceDate || '',
      source_column_index: Number.isFinite(b.sourceCol) ? b.sourceCol : null,
      source_plan_branch_external_id: '',
      label: b.label || '',
      display_order: i,
      })),
      ...(s.actualBranches || []).map((b, i) => ({
      external_id: b.id,
      branch_context: 'actual',
      variant_external_id: b.variantId,
      parent_stage_external_id: b.parentNodeId || b.sourceNodeId || '',
      source_stage_external_id: b.sourceNodeId || b.parentNodeId || '',
      source_month: b.sourceDate || '',
      source_column_index: Number.isFinite(b.sourceCol) ? b.sourceCol : null,
      source_plan_branch_external_id: b.sourcePlanBranchId || '',
      label: b.label || '',
      display_order: i,
      })),
    ],
    stages: [
      ...mapStages(s.planNodes, 'plan', n => ({ variant_external_id: n.variantId })),
      ...mapStages(s.actualNodes, 'actual', n => ({ variant_external_id: n.variantId })),
      ...mapStages(s.branchNodes, 'branch_plan', n => ({ branch_external_id: n.branchId })),
      ...mapStages(s.actualBranchNodes, 'branch_actual', n => ({ branch_external_id: n.branchId })),
    ],
    mergeLinks: [
      ...(s.mergeLinks || []).map(l => ({
      external_id: l.id,
      merge_context: 'plan',
      branch_external_id: l.fromBranchId,
      source_stage_external_id: l.fromNodeId,
      target_stage_external_id: l.toNodeId || '',
      target_month: l.toDate || '',
      target_column_index: Number.isFinite(l.toCol) ? l.toCol : null,
      })),
      ...(s.actualMergeLinks || []).map(l => ({
      external_id: l.id,
      merge_context: 'actual',
      branch_external_id: l.fromBranchId,
      source_stage_external_id: l.fromNodeId,
      target_stage_external_id: l.toNodeId || '',
      target_month: l.toDate || '',
      target_column_index: Number.isFinite(l.toCol) ? l.toCol : null,
      })),
    ],
  };
}

function createDataverseDelta(draft, baseline) {
  const nextPayload = createDataversePayload(draft);
  const prevPayload = createDataversePayload(baseline || {});
  const changedGroups = ['project', 'variants', 'branches', 'stages', 'mergeLinks'].filter(
    g => stableStringify(nextPayload[g]) !== stableStringify(prevPayload[g])
  );
  return { hasChanges: changedGroups.length > 0, changedGroups, current: nextPayload, baseline: prevPayload };
}

function writeLocalSubmitVersion(projectId, submitVersion) {
  const keys = getStorageKeys(projectId);
  const versions = mergeSubmitVersions(readLocalJson(keys.submitVersions) || [], submitVersion);
  const cutoffs = getFallbackDiscussionCutoffs(submitVersion.state || {}, versions, readLocalJson(keys.discussionCutoffs));
  writeLocalJson(keys.submitVersions, versions);
  writeLocalJson(keys.discussionCutoffs, cutoffs);
  return { versions, cutoffs };
}

async function saveDraftToDataverse(draft, baseline, submittedAt = new Date().toISOString()) {
  const delta = createDataverseDelta(draft, baseline);
  const submitVersion = createSubmitVersionRecord(draft, delta.current, submittedAt);
  const bridge = window.ProjectTrackerDataverse;

  if (bridge && typeof bridge.saveProject === 'function') {
    const result = await bridge.saveProject({
      projectId: draft.projectId,
      delta,
      payload: delta.current,
      submitVersion,
      submittedVersion: submitVersion,
    });
    return {
      ...(result || {}),
      submitVersion: (result && (result.submitVersion || result.submittedVersion)) || submitVersion,
    };
  }

  const localHistory = writeLocalSubmitVersion(draft.projectId, submitVersion);
  writeLocalJson(`${STORAGE_PREFIX}:dataverse-payload:${draft.projectId}`, {
    projectId: draft.projectId,
    savedAt: new Date().toISOString(),
    delta,
    submitVersion,
  });
  console.warn('ProjectTrackerDataverse.saveProject not configured; Dataverse payload saved locally.');
  return {
    projectId: draft.projectId,
    developmentOnly: true,
    submitVersion,
    submitVersions: localHistory.versions,
    discussionCutoffDates: localHistory.cutoffs,
  };
}

// ════════════════════════════════════════════════════════════════
// § 5  RENDERERS  ─  receive state, write DOM, never call set()
// ════════════════════════════════════════════════════════════════

// DOM element refs (stable across renders)
const yearHeader = $('yearHeader');
const monthHeader = $('monthHeader');
const tlGrid = $('tlGrid');
const sbRows = $('sbRows');
const tlScroll = $('tlScroll');
const nodePopup = $('nodePopup');
const ctxMenu = $('ctxMenu');
const modalOverlay = $('modalOverlay');
const modalBody = $('modalBody');
const modalTitle = $('modalTitle');

function isSnapshotReadOnlyMode() {
  return snapshotView.selected !== TIMELINE_VERSION_CURRENT && !!snapshotView.state;
}

function getTimelineRenderState() {
  return isSnapshotReadOnlyMode() ? snapshotView.state : store.getState();
}

function getTimelineVersionOptions() {
  return buildTimelineVersionOptions(discussionCutoffDates, submitVersions);
}

function getTimelineVersionLabel(value) {
  const option = getTimelineVersionOptions().find(item => item.value === value);
  return option ? option.label : 'Current';
}

function clearTransientTimelineUi() {
  nodePopup.classList.remove('active');
  ctxMenu.classList.remove('active');
  pendCell = null;
  ctxId = null;
  ctxRowType = null;
  ctxCell = null;
  if (mergePick) clearMergePick();
}

function refreshTimelineVersionPicker() {
  const select = $('timelineVersionSelect');
  if (!select) return;
  const options = getTimelineVersionOptions();
  if (!options.some(option => option.value === snapshotView.selected && !option.disabled)) {
    snapshotView = { selected: TIMELINE_VERSION_CURRENT, state: null, cutoffDate: '', versionId: '' };
  }
  select.innerHTML = options.map(option => {
    const disabled = option.disabled ? ' disabled' : '';
    const detail = option.disabled ? ' - no submitted version' : '';
    return `<option value="${escapeHtml(option.value)}"${disabled}>${escapeHtml(option.label + detail)}</option>`;
  }).join('');
  select.value = snapshotView.selected;
}

async function loadSubmitVersionForOption(option) {
  if (!option || !option.versionId) return null;
  let version = submitVersions.find(item => item.id === option.versionId) || null;
  if (version && version.state) return version;
  const bridge = window.ProjectTrackerDataverse;
  if (bridge && typeof bridge.getSubmitVersion === 'function') {
    const result = await bridge.getSubmitVersion({
      projectId: store.getState().projectId,
      versionId: option.versionId,
    });
    version = normalizeSubmitVersion(result && (result.submitVersion || result.version || result));
    if (version) {
      submitVersions = mergeSubmitVersions(submitVersions, version);
      refreshTimelineVersionPicker();
      return version;
    }
  }
  return version;
}

async function selectTimelineVersion(value) {
  const select = $('timelineVersionSelect');
  const option = getTimelineVersionOptions().find(item => item.value === value);
  if (!option || option.disabled || option.type === 'current') {
    snapshotView = { selected: TIMELINE_VERSION_CURRENT, state: null, cutoffDate: '', versionId: '' };
    if (select) select.value = TIMELINE_VERSION_CURRENT;
    syncHeaderInputsFromState(store.getState());
    renderAll();
    updateDraftStatus();
    return;
  }

  const version = await loadSubmitVersionForOption(option);
  if (!version || !version.state) {
    alert('Snapshot data is not available for this timeline version.');
    snapshotView = { selected: TIMELINE_VERSION_CURRENT, state: null, cutoffDate: '', versionId: '' };
    if (select) select.value = TIMELINE_VERSION_CURRENT;
    syncHeaderInputsFromState(store.getState());
    renderAll();
    updateDraftStatus();
    return;
  }

  clearTransientTimelineUi();
  snapshotView = {
    selected: option.value,
    cutoffDate: option.cutoffDate,
    versionId: version.id,
    state: {
      ...cloneState(version.state),
      discussionDate: option.cutoffDate || version.state.discussionDate || '',
    },
  };
  if (select) select.value = option.value;
  syncHeaderInputsFromState(snapshotView.state);
  renderAll();
  updateDraftStatus(`Viewing ${option.label}`);
}

function syncTimelineVersionsFromSaveResult(result) {
  if (!result) return;
  if (result.submitVersions || result.versions) {
    submitVersions = normalizeSubmitVersions(result.submitVersions || result.versions);
  } else if (result.submitVersion || result.submittedVersion) {
    submitVersions = mergeSubmitVersions(submitVersions, result.submitVersion || result.submittedVersion);
  }

  const incomingCutoffs = normalizeDiscussionCutoffDates(
    result.discussionCutoffDates || result.cutoffDates || result.discussionPeriods || []
  );
  discussionCutoffDates = incomingCutoffs.length
    ? incomingCutoffs
    : getFallbackDiscussionCutoffs(store.getState(), submitVersions, discussionCutoffDates);

  const keys = getCurrentStorageKeys();
  writeLocalJson(keys.submitVersions, submitVersions);
  writeLocalJson(keys.discussionCutoffs, discussionCutoffDates);
  refreshTimelineVersionPicker();
}

function updateSnapshotReadOnlyUi() {
  const readOnly = isSnapshotReadOnlyMode();
  document.body.classList.toggle('snapshot-readonly', readOnly);
  [
    'fProject', 'fLocation', 'fPlant', 'fProjType', 'fStatus', 'variantInput',
    'nodeTypeSelect', 'addVariantBtn', 'publishToggle', 'revertDraftBtn',
    'copyActualBtn', 'addYearBtn', 'addMsRowBtn', 'addMsColBtn',
    'addEopRowBtn', 'submitBtn',
  ].forEach(id => {
    const el = $(id);
    if (el) el.disabled = readOnly;
  });
  const remarks = $('remarksBox');
  if (remarks) remarks.contentEditable = readOnly ? 'false' : 'true';
  document.querySelectorAll('.stage-icon-option').forEach(btn => {
    btn.disabled = readOnly;
  });
}

function renderAll() {
  let s = getTimelineRenderState();
  if (!isSnapshotReadOnlyMode()) s = ensureFutureActualBlankSpaceVisible(s);
  renderHeaders(s);
  renderSidebar(s);
  renderGrid(s);
  renderNodes(s);
  renderBottomTables(s);
  updateSnapshotReadOnlyUi();
}

function renderHeaders(state) {
  yearHeader.innerHTML = '';
  monthHeader.innerHTML = '';
  const tc = totalCols(state);
  yearHeader.style.width = monthHeader.style.width = (tc * COL) + 'px';
  state.years.forEach((yr, yearIndex) => {
    const yb = document.createElement('div');
    yb.className = 'yr-block';
    yb.style.width = (COL * 12) + 'px';
    yb.textContent = yr;
    yearHeader.appendChild(yb);
    for (let m = 1; m <= 12; m++) {
      const col = yearIndex * 12 + m - 1;
      const mc = document.createElement('div');
      mc.className = ['mo-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
      mc.style.width = COL + 'px';
      mc.textContent = m;
      monthHeader.appendChild(mc);
    }
  });
}

function renderSidebar(state) {
  sbRows.innerHTML = '';
  const totalH = getSidebarH(state);
  if (!state.variants.length) {
    sbRows.innerHTML = '<div class="empty-sb">No variants yet.<br>Add one in the header.</div>';
    return;
  }
  const row = document.createElement('div');
  row.className = 'sidebar-row';
  row.style.height = totalH + 'px';
  row.innerHTML = `
    <div class="sr-cell sno" style="height:${totalH}px">1</div>
    <div class="sr-cell proj" style="height:${totalH}px">
      <span class="vr-name">${escapeHtml(state.info.project || '—')}</span>
    </div>
    <div class="sr-cell loc" style="height:${totalH}px">${escapeHtml(state.info.location || '—')}</div>
    <div class="sr-cell plant" style="height:${totalH}px">${escapeHtml(state.info.plant || '—')}</div>
    <div class="sr-cell pa" style="height:${totalH}px;flex-direction:column;padding:0">
      ${hasEopLane(state) ? `<div class="pa-eop-spacer" style="height:${getTopOffset(state)}px"></div>` : ''}
      <div class="pa-plan" style="height:${getPlannedH(state)}px">plan</div>
      <div class="pa-divider" style="height:${getDividerH(state)}px"></div>
      <div class="pa-actual" style="height:${getActualH(state)}px">Actual</div>
    </div>`;
  sbRows.appendChild(row);
}

function renderGrid(state) {
  tlGrid.innerHTML = '';
  const tc = totalCols(state);
  tlGrid.style.width = (tc * COL) + 'px';

  if (!state.variants.length) {
    const h = document.createElement('div');
    h.className = 'empty-hint';
    h.innerHTML = '<div class="emo">🕐</div><div>Add a variant to get started</div>';
    tlGrid.appendChild(h);
    return;
  }

  const grp = document.createElement('div');
  grp.className = 'grid-vr-grp';
  grp.style.position = 'relative';
  grp.style.height = getGridGroupH(state) + 'px';
  grp.dataset.vId = state.variants[0] ? state.variants[0].id : '';

  renderEopLane(grp, tc, state);

  getPlanLanes(state).forEach(lane => {
    const geom = getPlanLaneGeometry(state, lane.type === 'branch' ? 'branch' : 'plan', lane.type === 'branch' ? lane.branchId : lane.variantId);
    const sr = lane.type === 'branch'
      ? makeBranchSubRow(tc, lane.branchId, 'branch', lane.label, state, geom)
      : makeSubRow(tc, lane.variantId, 'plan', state, geom);
    grp.appendChild(sr);
  });

  const dv = document.createElement('div');
  dv.className = 'pa-grid-div';
  dv.style.height = '4px';
  dv.style.background = 'var(--border2)';
  grp.appendChild(dv);

  getActualLanes(state).forEach((lane, index) => {
    const geom = getActualLaneGeometry(state, lane.type === 'actualBranch' ? 'branch' : 'actual', lane.type === 'actualBranch' ? lane.branchId : lane.variantId);
    const sr = lane.type === 'actualBranch'
      ? makeBranchSubRow(tc, lane.branchId, 'actualBranch', lane.label, state, geom)
      : makeSubRow(tc, lane.variantId, 'actual', state, geom);
    if (index === 0) sr.classList.add('actual-first');
    grp.appendChild(sr);
  });

  tlGrid.appendChild(grp);
  drawLines(grp, state);
  renderVariantLabels(state);
  renderMergeHint(state);
}

function renderEopLane(grp, tc, state) {
  if (!hasEopLane(state)) return;
  const row = document.createElement('div');
  row.className = 'grid-sub-row eop-row';
  row.style.height = ROH + 'px';
  row.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = ['g-cell', 'eop-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
    row.appendChild(c);
  }
  grp.appendChild(row);
  const items = getEopItemsForState(state)
    .map(item => ({ ...item, col: Number.isFinite(item.col) ? item.col : dateToCol(item.date, state) }))
    .filter(item => item.col >= 0);
  if (items.length) {
    const y = ROH / 2;
    const maxX = Math.max(...items.map(item => item.col * COL + COL / 2));
    const line = document.createElement('div');
    line.className = 'eop-line';
    line.style.cssText = `left:0;top:${y - 1}px;width:${maxX}px`;
    row.appendChild(line);
  }
  items.forEach(item => {
    const col = Number.isFinite(item.col) ? item.col : dateToCol(item.date, state);
    if (col < 0) return;
    const y = ROH / 2;
    const x = col * COL + COL / 2;
    const mark = document.createElement('div');
    mark.className = 'eop-x';
    mark.style.cssText = `left:${x - 8}px;top:${y - 12}px`;
    mark.textContent = 'X';
    mark.title = [item.label, item.date].filter(Boolean).join(' - ');
    row.appendChild(mark);
    if (item.label) {
      const label = document.createElement('div');
      label.className = 'eop-label';
      label.style.cssText = `left:${x + 9}px;top:${y + 8}px`;
      label.textContent = item.label;
      row.appendChild(label);
    }
  });
}

function makeSubRow(tc, vId, rType, state, geom) {
  const sr = document.createElement('div');
  const readOnly = isSnapshotReadOnlyMode();
  sr.className = 'grid-sub-row ' + (rType === 'plan' ? 'plan-sub' : 'actual-sub');
  sr.style.height = `${(geom && geom.height) || ROH}px`;
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    c.className = ['g-cell', getDiscussionPeriodClass(col, state)].filter(Boolean).join(' ');
    c.dataset.col = col;
    c.dataset.vId = vId;
    c.dataset.rType = rType;
    if (!readOnly) {
      c.addEventListener('click', onCellClick);
      if (rType === 'plan' || rType === 'actual') c.addEventListener('contextmenu', showCellCtx);
    }
    sr.appendChild(c);
  }
  renderTimelineInLaneSummaries(sr, state, geom && geom.key);
  return sr;
}

function makeBranchSubRow(tc, branchId, rType, label, state, geom) {
  const sr = document.createElement('div');
  const readOnly = isSnapshotReadOnlyMode();
  sr.className = 'grid-sub-row branch-sub' + (rType === 'actualBranch' ? ' actual-branch-sub' : '');
  sr.style.height = `${(geom && geom.height) || ROH}px`;
  sr.style.position = 'relative';
  for (let col = 0; col < tc; col++) {
    const c = document.createElement('div');
    const placement = canPlaceBranchStageAtCol(state, rType, branchId, col);
    c.className = ['g-cell', getDiscussionPeriodClass(col, state), placement.ok ? '' : 'branch-stage-disabled'].filter(Boolean).join(' ');
    c.dataset.col = col;
    c.dataset.branchId = branchId;
    c.dataset.rType = rType;
    if (placement.ok && !readOnly) c.addEventListener('click', onCellClick);
    else c.title = placement.reason;
    sr.appendChild(c);
  }
  const pill = document.createElement('div');
  pill.className = 'branch-div-pill' + (rType === 'actualBranch' ? ' actual-branch-pill' : '');
  const sourceCol = getBranchStartCol(state, rType, branchId);
  if (sourceCol != null) {
    const sourceX = sourceCol * COL + COL / 2;
    const leftOfLine = sourceX - 112;
    pill.style.left = `${leftOfLine >= 4 ? leftOfLine : sourceX + 10}px`;
  }
  const pillText = document.createElement('span');
  pillText.textContent = '↳ ' + (label || 'Branch');
  pill.appendChild(pillText);
  if (!readOnly && (rType === 'branch' || rType === 'actualBranch')) {
    const del = document.createElement('button');
    del.className = 'branch-pill-del';
    del.type = 'button';
    del.title = 'Delete branch row';
    del.textContent = '×';
    del.addEventListener('click', e => {
      e.stopPropagation();
      if (rType === 'actualBranch') {
        store.getState().removeActualBranch(branchId);
      } else {
        store.getState().removeBranch(branchId);
      }
      if (mergePick && mergePick.fromBranchId === branchId) clearMergePick();
      renderAll();
      persistDraftNow();
    });
    pill.appendChild(del);
  }
  sr.appendChild(pill);
  renderTimelineInLaneSummaries(sr, state, geom && geom.key);
  return sr;
}

function drawLines(grp, state) {
  document.querySelectorAll('.tl-line,.tl-relationship-svg').forEach(e => e.remove());
  if (!grp || !state.variants.length) return;

  state.variants.forEach(vr => {
    const geom = getPlanLaneGeometry(state, 'plan', vr.id);
    if (!geom) return;
    const pn = state.planNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = geom.stageY;
    for (let i = 0; i < pn.length - 1; i++)
      mkLine(grp, getStageVisualX(pn[i], 'plan', state), y, getStageVisualX(pn[i + 1], 'plan', state), y, '#2563eb');
    const lastPlan = pn[pn.length - 1];
    if (lastPlan) {
      const branchIds = new Set(state.branches.filter(b => b.variantId === vr.id).map(b => b.id));
      const maxMergeCol = Math.max(-1, ...state.mergeLinks
        .filter(link => branchIds.has(link.fromBranchId))
        .map(link => getMergeTargetCol(link, state))
        .filter(col => Number.isFinite(col)));
      if (maxMergeCol > lastPlan.col) {
        mkLine(grp, getStageVisualX(lastPlan, 'plan', state), y, maxMergeCol * COL + COL / 2, y, '#2563eb');
      }
    }
  });

  state.branches.forEach(br => {
    const geom = getPlanLaneGeometry(state, 'branch', br.id);
    if (!geom) return;
    const bY = geom.stageY;
    const bn = state.branchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < bn.length - 1; i++)
      mkLine(grp, getStageVisualX(bn[i], 'branch', state), bY, getStageVisualX(bn[i + 1], 'branch', state), bY, '#00c9b1');
  });

  state.variants.forEach(vr => {
    const geom = getActualLaneGeometry(state, 'actual', vr.id);
    if (!geom) return;
    const an = state.actualNodes.filter(n => n.variantId === vr.id).sort((a, b) => a.col - b.col);
    const y = geom.stageY;
    for (let i = 0; i < an.length - 1; i++)
      mkLine(grp, getStageVisualX(an[i], 'actual', state), y, getStageVisualX(an[i + 1], 'actual', state), y, '#f97316');
    const lastActual = an[an.length - 1];
    if (lastActual) {
      const branchIds = new Set((state.actualBranches || []).filter(b => b.variantId === vr.id).map(b => b.id));
      const maxMergeCol = Math.max(-1, ...(state.actualMergeLinks || [])
        .filter(link => branchIds.has(link.fromBranchId))
        .map(link => getMergeTargetCol(link, state))
        .filter(col => Number.isFinite(col)));
      if (maxMergeCol > lastActual.col) {
        mkLine(grp, getStageVisualX(lastActual, 'actual', state), y, maxMergeCol * COL + COL / 2, y, '#f97316');
      }
    }
  });

  (state.actualBranches || []).forEach(br => {
    const geom = getActualLaneGeometry(state, 'branch', br.id);
    if (!geom) return;
    const y = geom.stageY;
    const nodes = state.actualBranchNodes.filter(n => n.branchId === br.id).sort((a, b) => a.col - b.col);
    for (let i = 0; i < nodes.length - 1; i++)
      mkLine(grp, getStageVisualX(nodes[i], 'actualBranch', state), y, getStageVisualX(nodes[i + 1], 'actualBranch', state), y, '#f97316');
  });

  drawRelationshipArrows(grp, state);
}

function mkLine(parent, x1, y1, x2, y2, color) {
  const d = document.createElement('div');
  d.className = 'tl-line';
  d.style.cssText = `position:absolute;background:${color};opacity:.8;z-index:3;pointer-events:none;left:${Math.min(x1, x2)}px;top:${y1 - 1}px;width:${Math.abs(x2 - x1)}px;height:2px`;
  parent.appendChild(d);
}

function drawRelationshipArrows(grp, state) {
  const svg = makeRelationshipSvg(state);
  let hasArrows = false;

  state.branches.forEach(br => {
    const firstChild = getFirstBranchNode(br.id, state);
    const from = getBranchSourcePoint(br, state);
    const to = firstChild ? getBranchNodeCenter(firstChild, state) : getBranchLaneAnchorPoint(br, state);
    if (!from || !to) return;
    addBranchStartPath(svg, from, to, 'branch-start-arrow', 'branchStartArrow');
    hasArrows = true;
  });

  (state.actualBranches || []).forEach(br => {
    const firstChild = getFirstActualBranchNode(br.id, state);
    const from = getActualBranchSourcePoint(br, state);
    const to = firstChild ? getActualBranchNodeCenter(firstChild, state) : getActualBranchLaneAnchorPoint(br, state);
    if (!from || !to) return;
    addBranchStartPath(svg, from, to, 'actual-branch-start-arrow', 'actualBranchStartArrow');
    hasArrows = true;
  });

  state.mergeLinks.forEach(link => {
    const fromNode = state.branchNodes.find(n => n.id === link.fromNodeId && n.branchId === link.fromBranchId);
    if (!fromNode) return;
    const from = getBranchNodeCenter(fromNode, state);
    const to = getMergeTargetPoint(link, state);
    if (!from || !to) return;
    addMergeBackPath(svg, from, to);
    hasArrows = true;
  });

  (state.actualMergeLinks || []).forEach(link => {
    const fromNode = (state.actualBranchNodes || []).find(n => n.id === link.fromNodeId && n.branchId === link.fromBranchId);
    if (!fromNode) return;
    const from = getActualBranchNodeCenter(fromNode, state);
    const to = getActualMergeTargetPoint(link, state);
    if (!from || !to) return;
    addActualMergeBackPath(svg, from, to);
    hasArrows = true;
  });

  (state.stageShifts || []).forEach(shift => {
    const source = findStageByContext(state, shift.sourceContext, shift.sourceNodeId);
    if (!source) return;
    const from = getStageCenterByContext(source, shift.sourceContext, state);
    const to = getStageShiftTargetCenter(shift, source, state);
    if (!from || !to) return;
    addStageShiftConnectorLine(svg, from, to, shift.mode);
    addStageShiftArrow(svg, from, to, shift.mode);
    hasArrows = true;
  });

  if (hasArrows) grp.appendChild(svg);
}

function makeRelationshipSvg(state) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('tl-relationship-svg');
  const w = totalCols(state) * COL;
  const h = getGridGroupH(state);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `
    <defs>
      <marker id="branchStartArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z" fill="#00c9b1"></path>
      </marker>
      <marker id="actualBranchStartArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z" fill="#f97316"></path>
      </marker>
      <marker id="mergeLinkArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z" fill="#00c9b1"></path>
      </marker>
      <marker id="preponedOpenArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,1 L8,5 L0,9" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
      <marker id="postponedOpenArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,1 L8,5 L0,9" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
    </defs>`;
  return svg;
}

function addArrowPath(svg, from, to, cls, markerId) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const midY = from.y + (to.y - from.y) / 2;
  path.setAttribute('class', cls);
  path.setAttribute('d', `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`);
  path.setAttribute('marker-end', `url(#${markerId})`);
  svg.appendChild(path);
}

function addBranchStartPath(svg, from, to, cls, markerId) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', cls);
  path.setAttribute('d', `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`);
  path.setAttribute('marker-end', `url(#${markerId})`);
  svg.appendChild(path);
}

function addMergeBackPath(svg, from, to) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'merge-link-arrow');
  path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`);
  svg.appendChild(path);
}

function addActualMergeBackPath(svg, from, to) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'actual-merge-link-arrow');
  path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`);
  svg.appendChild(path);
}

function addStageShiftConnectorLine(svg, from, to, mode) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', `stage-shift-normal-line ${mode}-shift-line`);
  path.setAttribute('d', `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
  svg.appendChild(path);
}

function addStageShiftArrow(svg, from, to, mode) {
  const midX = from.x + (to.x - from.x) / 2;
  const archY = Math.min(from.y, to.y) - SHIFT_ARROW_ARCH;
  const d = `M ${from.x} ${from.y} Q ${midX} ${archY} ${to.x} ${to.y}`;
  const markerId = mode === 'preponed' ? 'preponedOpenArrow' : 'postponedOpenArrow';
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  outline.setAttribute('class', 'stage-shift-arrow-outline');
  outline.setAttribute('d', d);
  svg.appendChild(outline);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', `stage-shift-arrow ${mode}-shift-arrow`);
  path.setAttribute('d', d);
  path.setAttribute('marker-end', `url(#${markerId})`);
  svg.appendChild(path);
}

function getFirstBranchNode(branchId, state) {
  return state.branchNodes
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getFirstActualBranchNode(branchId, state) {
  return (state.actualBranchNodes || [])
    .filter(n => n.branchId === branchId)
    .sort((a, b) => a.col - b.col || String(a.id).localeCompare(String(b.id)))[0] || null;
}

function getPlanNodeCenter(node, state) {
  const geom = getPlanLaneGeometry(state, 'plan', node.variantId);
  if (!geom) return null;
  return { x: getStageVisualX(node, 'plan', state), y: geom.stageY };
}

function getBranchNodeCenter(node, state) {
  const geom = getPlanLaneGeometry(state, 'branch', node.branchId);
  if (!geom) return null;
  return { x: getStageVisualX(node, 'branch', state), y: geom.stageY };
}

function getActualNodeCenter(node, state) {
  const geom = getActualLaneGeometry(state, 'actual', node.variantId);
  if (!geom) return null;
  return { x: getStageVisualX(node, 'actual', state), y: geom.stageY };
}

function getActualBranchNodeCenter(node, state) {
  const geom = getActualLaneGeometry(state, 'branch', node.branchId);
  if (!geom) return null;
  return { x: getStageVisualX(node, 'actualBranch', state), y: geom.stageY };
}

function findStageByContext(state, context, nodeId) {
  const map = {
    plan: state.planNodes || [],
    actual: state.actualNodes || [],
    branch: state.branchNodes || [],
    actualBranch: state.actualBranchNodes || [],
  };
  return (map[context] || []).find(n => n.id === nodeId) || null;
}

function getStageCenterByContext(node, context, state) {
  if (context === 'plan') return getPlanNodeCenter(node, state);
  if (context === 'branch') return getBranchNodeCenter(node, state);
  if (context === 'actual') return getActualNodeCenter(node, state);
  if (context === 'actualBranch') return getActualBranchNodeCenter(node, state);
  return null;
}

function getStageShiftTargetCenter(shift, source, state) {
  const from = getStageCenterByContext(source, shift.sourceContext, state);
  if (!from || !Number.isFinite(shift.targetCol)) return null;
  return { x: getStageVisualX({ ...source, id: shift.id, col: shift.targetCol }, shift.sourceContext, state), y: from.y };
}

function renderNodes(state) {
  document.querySelectorAll('.node,.drs-detail-label').forEach(e => e.remove());
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;
  const shiftedNodeIds = new Set((state.stageShifts || []).map(shift => shift.sourceNodeId));

  state.planNodes.forEach(n => {
    const geom = getPlanLaneGeometry(state, 'plan', n.variantId);
    if (!geom) return;
    const y = geom.stageY;
    const x = getStageVisualX(n, 'plan', state);
    const el = mkNode(n, 'plan', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${x - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.branchNodes.forEach(n => {
    const geom = getPlanLaneGeometry(state, 'branch', n.branchId);
    if (!geom) return;
    const y = geom.stageY;
    const x = getStageVisualX(n, 'branch', state);
    const el = mkNode(n, 'branch', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${x - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.actualNodes.forEach(n => {
    const geom = getActualLaneGeometry(state, 'actual', n.variantId);
    if (!geom) return;
    const y = geom.stageY;
    const x = getStageVisualX(n, 'actual', state);
    const el = mkNode(n, 'actual', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${x - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  state.actualBranchNodes.forEach(n => {
    const geom = getActualLaneGeometry(state, 'branch', n.branchId);
    if (!geom) return;
    const y = geom.stageY;
    const x = getStageVisualX(n, 'actualBranch', state);
    const el = mkNode(n, 'actualBranch', shiftedNodeIds.has(n.id));
    el.style.cssText = `left:${x - 14}px;top:${y - 14}px`;
    grp.appendChild(el);
  });

  renderStageShiftNodes(grp, state);
  updateMergeTargetClasses();
}

function mkNode(n, rType, hasShift) {
  const el = document.createElement('div');
  const readOnly = isSnapshotReadOnlyMode();
  const cls = rType === 'plan' ? 'plan-node' : rType === 'branch' ? 'branch-node' : 'actual-node';
  el.className = 'node ' + cls + (readOnly ? ' readonly-node' : '');
  el.dataset.nodeId = n.id;
  el.dataset.rType = rType;
  if (n.variantId) el.dataset.variantId = n.variantId;
  if (n.branchId) el.dataset.branchId = n.branchId;

  const dh = isActualStageContext(rType) && n.date ? `<span class="node-date">${fmtActualDate(n.date)}</span>` : '';
  el.innerHTML = `
    <span class="node-label-top">${escapeHtml(n.topLabel || '')}</span>
    ${getStageVisualMarkup(n.type, `node-${n.id}`)}
    <span class="node-label-bottom">${escapeHtml(n.bottomLabel || '')}</span>
    ${dh}${hasShift ? '<span class="node-shift-cross">×</span>' : ''}${readOnly ? '' : '<button class="node-del">✕</button>'}`;

  if (!readOnly) {
    el.querySelector('.node-del').addEventListener('click', e => {
      e.stopPropagation();
      const a = store.getState();
      if (rType === 'plan') { a.removePlanNode(n.id); a.removeMergeLinksForNode(n.id); }
      else if (rType === 'branch') { a.removeBranchNode(n.id); a.removeMergeLinksForNode(n.id); }
      else if (rType === 'actualBranch') { a.removeActualBranchNode(n.id); a.removeActualMergeLinksForNode(n.id); }
      else { a.removeActualNode(n.id); a.removeActualMergeLinksForNode(n.id); }
      if (mergePick && mergePick.fromNodeId === n.id) clearMergePick();
      const s = store.getState();
      renderGrid(s); renderNodes(s); persistDraftNow();
    });

    el.addEventListener('click', e => handleMergeTargetClick(e, n, rType));
    el.addEventListener('mousedown', startNodeDrag);
    el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e, n.id, rType); });
  }
  return el;
}

function renderStageShiftNodes(grp, state) {
  (state.stageShifts || []).forEach(shift => {
    const source = findStageByContext(state, shift.sourceContext, shift.sourceNodeId);
    if (!source) return;
    const target = getStageShiftTargetCenter(shift, source, state);
    if (!target) return;
    const el = mkShiftedNode(source, shift);
    el.style.cssText = `left:${target.x - 14}px;top:${target.y - 14}px`;
    grp.appendChild(el);
  });
}

function mkShiftedNode(source, shift) {
  const el = document.createElement('div');
  el.className = `node shifted-node shifted-${shift.mode}`;
  el.dataset.sourceNodeId = shift.sourceNodeId;
  el.dataset.shiftId = shift.id;
  el.innerHTML = `
    <span class="node-label-top">${escapeHtml(source.topLabel || '')}</span>
    ${getStageVisualMarkup(source.type, `shift-${shift.id}`)}
    <span class="node-label-bottom">${escapeHtml(source.bottomLabel || '')}</span>
    ${shift.targetDate ? `<span class="node-date">${fmtDate(shift.targetDate)}</span>` : ''}`;
  return el;
}

function renderBottomTables(state) {
  state = state || store.getState();
  const readOnly = isSnapshotReadOnlyMode();
  renderDynTable('msTableWrap', state.leftTable, {
    updateCell: (ri, ci, v) => { store.getState().updateLeftTableCell(ri, ci, v); renderGrid(store.getState()); renderNodes(store.getState()); scheduleDraftSave(); },
    updateColName: (ci, name) => { store.getState().updateLeftTableColName(ci, name); renderGrid(store.getState()); renderNodes(store.getState()); scheduleDraftSave(); },
    deleteCol: (ci) => { store.getState().deleteLeftTableCol(ci); renderBottomTables(); renderGrid(store.getState()); renderNodes(store.getState()); persistDraftNow(); },
    deleteRow: (ri) => { store.getState().deleteLeftTableRow(ri); renderBottomTables(); renderGrid(store.getState()); renderNodes(store.getState()); persistDraftNow(); },
  }, { readOnly });
  renderDynTable('eopTableWrap', state.rightTable, {
    updateCell: (ri, ci, v) => { store.getState().updateRightTableCell(ri, ci, v); scheduleDraftSave(); },
    updateColName: (ci, name) => { store.getState().updateRightTableColName(ci, name); scheduleDraftSave(); },
    deleteCol: (ci) => { store.getState().deleteRightTableCol(ci); renderBottomTables(); persistDraftNow(); },
    deleteRow: (ri) => { store.getState().deleteRightTableRow(ri); renderBottomTables(); persistDraftNow(); },
  }, { allowColumnEdit: false, allowColumnDelete: false, readOnly });
}

function renderDynTable(wrapId, tbl, cbs, options = {}) {
  const readOnly = !!options.readOnly;
  const allowColumnEdit = !readOnly && options.allowColumnEdit !== false;
  const allowColumnDelete = !readOnly && options.allowColumnDelete !== false;
  const allowRowDelete = !readOnly;
  const wrap = $(wrapId);
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'dyn-table';

  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  tbl.cols.forEach((col, ci) => {
    const th = document.createElement('th');
    th.className = 'dyn-th';
    const sp = document.createElement('span');
    sp.contentEditable = allowColumnEdit ? 'true' : 'false';
    sp.className = 'th-name' + (allowColumnEdit ? '' : ' readonly');
    sp.textContent = col;
    if (allowColumnEdit) {
      sp.addEventListener('blur', () => cbs.updateColName(ci, sp.textContent.trim()));
    }
    th.appendChild(sp);
    if (allowColumnDelete && ci > 0) {
      const dx = document.createElement('button');
      dx.className = 'col-del';
      dx.textContent = '×';
      dx.addEventListener('click', () => cbs.deleteCol(ci));
      th.appendChild(dx);
    }
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbl.rows.forEach((row, ri) => {
    const tr = document.createElement('tr');
    row.forEach((cell, ci) => {
      const td = document.createElement('td');
      const isDateCol = tbl.cols[ci] && /date|month/i.test(tbl.cols[ci]);

      if (isDateCol) {
        td.className = 'dyn-td dyn-td-date';
        const inp = document.createElement('input');
        inp.type = 'month';
        inp.value = cell || '';
        inp.className = 'dyn-date-input';
        inp.disabled = readOnly;
        if (!readOnly) inp.addEventListener('change', () => cbs.updateCell(ri, ci, inp.value));
        td.appendChild(inp);
      } else {
        td.className = 'dyn-td' + (cell ? ' filled' : '');
        td.contentEditable = readOnly ? 'false' : 'true';
        td.textContent = cell;
        if (!readOnly) {
          td.addEventListener('input', () => {
            cbs.updateCell(ri, ci, td.textContent.trim());
            td.classList.toggle('filled', !!td.textContent.trim());
          });
        }
      }
      tr.appendChild(td);
    });

    if (allowRowDelete) {
      const tdx = document.createElement('td');
      tdx.className = 'dyn-td row-del-cell';
      const rdx = document.createElement('button');
      rdx.className = 'row-del';
      rdx.textContent = '×';
      rdx.addEventListener('click', () => cbs.deleteRow(ri));
      tdx.appendChild(rdx);
      tr.appendChild(tdx);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function renderVariantLabels(state) {
  tlGrid.querySelectorAll('.vr-float-label').forEach(e => e.remove());
  getPlanLanes(state).forEach(lane => {
    if (lane.type !== 'plan') return;
    const geom = getPlanLaneGeometry(state, 'plan', lane.variantId);
    if (!geom) return;
    addVariantLabel(`plan:${lane.variantId}`, lane.variantId, lane.label, 50,
      geom.stageY - 7, 'plan', state);
  });
  getActualLanes(state).forEach(lane => {
    if (lane.type !== 'actual') return;
    const geom = getActualLaneGeometry(state, 'actual', lane.variantId);
    if (!geom) return;
    addVariantLabel(`actual:${lane.variantId}`, lane.variantId, lane.label, 50,
      geom.stageY - 7, 'actual', state);
  });
}

function addVariantLabel(key, variantId, text, defaultX, defaultY, mode, state) {
  const el = document.createElement('div');
  el.className = 'vr-float-label ' + (mode === 'actual' ? 'actual-vr-label' : 'plan-vr-label');
  el.dataset.labelKey = key;
  el.dataset.vrId = variantId;
  const pos = state.labelPositions[key] || { x: defaultX, y: defaultY };
  el.style.cssText = `left:${pos.x}px;top:${pos.y}px`;
  el.textContent = text || '';
  const del = document.createElement('button');
  del.className = 'vfl-del';
  del.textContent = '×';
  if (!isSnapshotReadOnlyMode()) {
    del.addEventListener('click', event => {
      event.stopPropagation();
      window.deleteVariant(variantId);
    });
    el.appendChild(del);
    el.addEventListener('mousedown', startVLabelDrag);
  }
  tlGrid.appendChild(el);
}

function splitSummaryLines(value) {
  return String(value || '')
    .split(/[\r\n\u2028\u2029]+/)
    .map(line => line.trim())
    .filter(Boolean);
}

function getRemarkSummaryItems(state) {
  return splitSummaryLines(state && state.remarks).map(text => ({ text }));
}

function getStageContextSummaryLabel(rType) {
  if (rType === 'plan') return 'Plan';
  if (rType === 'branch') return 'Branch Plan';
  if (rType === 'actual') return 'Actual';
  if (rType === 'actualBranch') return 'Branch Actual';
  return '';
}

function getVariantSummaryName(state, variantId) {
  const variant = (state.variants || []).find(v => v.id === variantId);
  return variant ? variant.name : '';
}

function getBranchSummaryName(state, rType, branchId) {
  const branches = rType === 'actualBranch' ? (state.actualBranches || []) : (state.branches || []);
  const branch = branches.find(b => b.id === branchId);
  return branch ? branch.label : '';
}

function getStageSummaryName(node) {
  return (node && (node.topLabel || node.bottomLabel || node.date || node.id)) || '';
}

function getStageSummaryLabel(state, rType, node) {
  const owner = rType === 'plan' || rType === 'actual'
    ? getVariantSummaryName(state, node && node.variantId)
    : getBranchSummaryName(state, rType, node && node.branchId);
  return [getStageContextSummaryLabel(rType), owner, getStageSummaryName(node)].filter(Boolean).join(' / ');
}

function collectDrsSummaryItems(state) {
  const items = [];
  [
    ['plan', state.planNodes || []],
    ['branch', state.branchNodes || []],
    ['actual', state.actualNodes || []],
    ['actualBranch', state.actualBranchNodes || []],
  ].forEach(([rType, nodes]) => {
    nodes.forEach(node => {
      const text = String(node.drsDetail || '').trim();
      if (!node.isDRS || !text) return;
      items.push({ label: getStageSummaryLabel(state, rType, node), text });
    });
  });
  (state.stageShifts || []).forEach(shift => {
    const text = String(shift.drsDetail || '').trim();
    if (!text) return;
    const source = findStageByContext(state, shift.sourceContext, shift.sourceNodeId);
    const mode = shift.mode === 'preponed' ? 'Preponed Shift' : 'Postponed Shift';
    const label = source
      ? [mode, getStageSummaryLabel(state, shift.sourceContext, source)].filter(Boolean).join(' / ')
      : mode;
    items.push({ label, text });
  });
  return items;
}

function makeTimelineSummaryBox(title, items, className) {
  const el = document.createElement('div');
  el.className = `timeline-summary-box ${className}`;
  const titleEl = document.createElement('div');
  titleEl.className = 'timeline-summary-title';
  titleEl.textContent = title;
  el.appendChild(titleEl);
  const list = document.createElement('ol');
  list.className = 'timeline-summary-list';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.label ? `${item.label}: ${item.text}` : item.text;
    list.appendChild(li);
  });
  el.appendChild(list);
  return el;
}

function makeMilestoneGridTable(data) {
  const el = document.createElement('div');
  el.className = 'milestone-grid-table';
  el.dataset.labelKey = 'milestone:table';

  const title = document.createElement('div');
  title.className = 'milestone-grid-title';
  title.textContent = 'Milestone Table';
  el.appendChild(title);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  data.cols.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  el.appendChild(table);
  return el;
}

function renderTimelineInLaneSummaries(rowEl, state, laneKey) {
  if (!laneKey) return;
  const overlays = getTimelineInLaneOverlays(state).filter(overlay => overlay.laneKey === laneKey);
  if (!overlays.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'timeline-inlane-overlays';
  wrap.style.top = `${ROH}px`;
  wrap.style.height = `${getTimelineLaneOverlayH(state, laneKey)}px`;
  wrap.style.width = `${totalCols(state) * COL}px`;

  overlays.forEach(overlay => {
    if (overlay.type === 'milestone') {
      wrap.appendChild(makeMilestoneGridTable(overlay.table));
      return;
    }
    const el = makeTimelineSummaryBox(overlay.title, overlay.items, overlay.className);
    if (overlay.type === 'drs') el.dataset.labelKey = `drs:${laneKey}`;
    wrap.appendChild(el);
  });

  rowEl.appendChild(wrap);
}

function renderMergeHint(state) {
  tlGrid.querySelectorAll('.merge-target-hint').forEach(e => e.remove());
  if (!mergePick) return;
  const grp = tlGrid.querySelector('.grid-vr-grp');
  if (!grp) return;
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  const geom = getPlanLaneGeometry(state, 'plan', branch.variantId);
  if (!geom) return;
  const hint = document.createElement('div');
  hint.className = 'merge-target-hint';
  hint.style.top = (geom.top + 8) + 'px';
  hint.textContent = 'Select parent stage to merge';
  grp.appendChild(hint);
}

function updateMergeTargetClasses() {
  document.querySelectorAll('.node.merge-valid-target,.node.merge-invalid-target').forEach(el => {
    el.classList.remove('merge-valid-target', 'merge-invalid-target');
  });
  if (!mergePick) return;
  const state = store.getState();
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch) return;
  document.querySelectorAll('.plan-node').forEach(el => {
    el.classList.add(el.dataset.variantId === branch.variantId ? 'merge-valid-target' : 'merge-invalid-target');
  });
}

function buildPdfExportRoot(slice, metrics) {
  const horizontalScale = slice.horizontalScale || 1;
  const root = document.createElement('div');
  root.className = 'pdf-export-root';
  root.style.width = `${metrics.sidebarWidth + slice.width}px`;
  root.style.height = `${metrics.headerHeight + metrics.gridHeight}px`;

  const table = document.createElement('div');
  table.className = 'pdf-export-table';

  const sidebarClone = $('sidebar').cloneNode(true);
  sidebarClone.classList.add('pdf-export-sidebar');
  sidebarClone.style.width = `${metrics.sidebarWidth}px`;
  sidebarClone.style.minWidth = `${metrics.sidebarWidth}px`;
  sidebarClone.style.maxWidth = `${metrics.sidebarWidth}px`;
  sidebarClone.style.height = `${metrics.headerHeight + metrics.gridHeight}px`;
  const sidebarRows = sidebarClone.querySelector('.sidebar-rows');
  if (sidebarRows) {
    sidebarRows.style.overflow = 'visible';
    sidebarRows.style.height = `${metrics.gridHeight}px`;
  }

  const timeline = document.createElement('div');
  timeline.className = 'pdf-export-timeline';
  timeline.style.width = `${slice.width}px`;
  timeline.style.height = `${metrics.headerHeight + metrics.gridHeight}px`;

  const headerClip = document.createElement('div');
  headerClip.className = 'pdf-export-header-clip';
  headerClip.style.width = `${slice.width}px`;
  headerClip.style.height = `${metrics.headerHeight}px`;

  const headerInner = document.createElement('div');
  headerInner.className = 'pdf-export-header-inner';
  headerInner.style.width = `${metrics.timelineWidth}px`;
  headerInner.style.transform = `translateX(-${slice.startX}px) scaleX(${horizontalScale})`;
  headerInner.appendChild(yearHeader.cloneNode(true));
  headerInner.appendChild(monthHeader.cloneNode(true));
  headerClip.appendChild(headerInner);

  const gridClip = document.createElement('div');
  gridClip.className = 'pdf-export-grid-clip';
  gridClip.style.width = `${slice.width}px`;
  gridClip.style.height = `${metrics.gridHeight}px`;

  const gridClone = tlGrid.cloneNode(true);
  gridClone.classList.add('pdf-export-grid');
  gridClone.style.width = `${metrics.timelineWidth}px`;
  gridClone.style.transform = `translateX(-${slice.startX}px) scaleX(${horizontalScale})`;
  gridClip.appendChild(gridClone);

  timeline.appendChild(headerClip);
  timeline.appendChild(gridClip);
  table.appendChild(sidebarClone);
  table.appendChild(timeline);
  root.appendChild(table);

  root.querySelectorAll('.node-del,.vr-del-btn,.vt-del-btn,.branch-pill-del,.col-del,.row-del,.sidebar-resize-handle').forEach(el => el.remove());
  return root;
}

async function exportPDF() {
  const overlay = $('pdfOverlay'), st = $('pdfStatus');
  overlay.classList.add('active');
  st.textContent = 'Preparing timeline table…';
  let pageRoot = null;
  await new Promise(r => setTimeout(r, 160));
  try {
    const exportState = getTimelineRenderState();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth(), pH = pdf.internal.pageSize.getHeight(), mg = 8;
    const maxW = pW - mg * 2, maxH = pH - mg * 2;
    const sidebarWidth = Math.ceil($('sidebar').getBoundingClientRect().width || $('sidebar').scrollWidth || 360);
    const timelineWidth = totalCols(exportState) * COL;
    const gridHeight = Math.ceil(tlGrid.scrollHeight || tlGrid.getBoundingClientRect().height || getGridGroupH(exportState));
    const headerHeight = YH + MH;
    const pxPerMm = 4;
    const timelinePageWidth = Math.max(COL, Math.floor(maxW * pxPerMm - sidebarWidth));
    const slice = getPdfTimelineSlice({
      totalCols: totalCols(exportState),
      colWidth: COL,
      timelineWidthPx: timelinePageWidth,
      horizontalScale: PDF_EXPORT_HORIZONTAL_SCALE,
    });

    st.textContent = 'Rendering timeline table…';
    pageRoot = buildPdfExportRoot(slice, { sidebarWidth, timelineWidth, gridHeight, headerHeight });
    document.body.appendChild(pageRoot);
    const captureWidth = pageRoot.offsetWidth;
    const captureHeight = pageRoot.offsetHeight;
    const canvas = await html2canvas(pageRoot, {
      scale: 2,
      useCORS: true,
      backgroundColor: document.body.dataset.theme === 'dark' ? '#0d1117' : '#dbe8f5',
      scrollX: 0,
      scrollY: 0,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
    });
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const iW = canvas.width * ratio, iH = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', mg + (maxW - iW) / 2, mg + (maxH - iH) / 2, iW, iH);
    st.textContent = 'Building PDF…';
    pdf.save(`${exportState.info.project || 'timeline'}_A4.pdf`);
    st.textContent = 'Done!';
    setTimeout(() => overlay.classList.remove('active'), 700);
  } catch (err) {
    st.textContent = 'Error: ' + err.message;
    setTimeout(() => overlay.classList.remove('active'), 2500);
  } finally {
    if (pageRoot) pageRoot.remove();
  }
}

// ════════════════════════════════════════════════════════════════
// § 6  EVENTS  ─  call store actions, then re-render as needed
// ════════════════════════════════════════════════════════════════

// Transient UI state (not persisted, not in store)
let pendCell = null;
let dragNode = null, dox = 0, doy = 0;
let dragStartX = 0, dragStartY = 0, nodeDragMoved = false;
let ctxId = null, ctxRowType = null;
let ctxCell = null;
let modalCb = null;
let dragVL = null, dvox = 0, dvoy = 0;
let dragRemark = null, drox = 0, droy = 0;
let dragDrsLabel = null, ddlx = 0, ddly = 0;
let dragMilestoneTable = null, dmox = 0, dmoy = 0;
let mergePick = null;

// ── Header form ──
function bindHeader() {
  const { info, remarks } = store.getState();
  $('fProject').value = info.project;
  $('fLocation').value = info.location;
  $('fPlant').value = info.plant;
  $('fProjType').value = info.type;
  $('fStatus').value = info.status;
  $('remarksBox').textContent = remarks || '';
  syncPubBtn();
  refreshTimelineVersionPicker();

  $('timelineVersionSelect').addEventListener('change', e => {
    selectTimelineVersion(e.target.value);
  });

  const map = { fProject: 'project', fLocation: 'location', fPlant: 'plant', fProjType: 'type', fStatus: 'status' };
  Object.entries(map).forEach(([id, key]) => {
    $(id).addEventListener('input', () => {
      store.getState().setInfo({ [key]: $(id).value });
      if (key === 'project' || key === 'location' || key === 'plant') renderSidebar(store.getState());
      scheduleDraftSave();
    });
  });

  $('publishToggle').addEventListener('click', () => {
    if (isSnapshotReadOnlyMode()) return;
    store.getState().setPublished(!store.getState().info.published);
    syncPubBtn();
    persistDraftNow();
  });

  $('revertDraftBtn').addEventListener('click', revertDraftToBaseline);

  $('remarksBox').addEventListener('input', () => {
    if (isSnapshotReadOnlyMode()) return;
    const remarksText = ($('remarksBox').innerText || $('remarksBox').textContent || '')
      .replace(/\r\n?/g, '\n')
      .trim();
    store.getState().setRemarks(remarksText);
    renderAll();
    scheduleDraftSave();
  });
}

function syncPubBtn(state = getTimelineRenderState()) {
  const btn = $('publishToggle');
  const pub = state.info && state.info.published;
  btn.textContent = pub ? '✓ Published' : 'Not Publish';
  btn.classList.toggle('published', pub);
}

// ── Cell click → open node popup ──
function onCellClick(e) {
  if (isSnapshotReadOnlyMode()) return;
  if (e.target.closest('.node')) return;
  if (mergePick) { clearMergePick(); return; }
  const cell = e.currentTarget;
  const state = store.getState();
  const col = +cell.dataset.col;
  const vId = cell.dataset.vId;
  const rType = cell.dataset.rType;
  const branchId = cell.dataset.branchId || null;
  const placement = canPlaceBranchStageAtCol(state, rType, branchId, col);
  if (!placement.ok) {
    alert(placement.reason);
    return;
  }
  pendCell = { col, vId, rType, branchId };
  const r = cell.getBoundingClientRect();
  nodePopup.style.cssText = `left:${r.left}px;top:${r.bottom + 4}px`;
  nodePopup.classList.add('active');
  configureNodePopupForContext(rType);
  $('npTop').value = '';
  $('npBottom').value = '';
  $('npDate').value = isActualStageContext(rType) ? colToInputDate(col, state) : colToInputMonth(col, state);
  setStageIconSelectValue($('npShape'), $('nodeTypeSelect').value);
  $('npIsDRS').checked = false;
  $('npDrsDetail').style.display = 'none';
  $('npDrsDetail').value = '';
  $('npTop').focus();
}

function configureNodePopupForContext(rType) {
  const bottom = $('npBottom');
  bottom.style.display = isPlanStageContext(rType) ? '' : 'none';
  bottom.disabled = !isPlanStageContext(rType);
  $('npDate').type = isActualStageContext(rType) ? 'date' : 'month';
  $('npDate').required = isActualStageContext(rType);
  $('npDate').min = '';
  $('npDate').max = '';
}

// ── Node popup ──
$('npIsDRS').addEventListener('change', () => {
  $('npDrsDetail').style.display = $('npIsDRS').checked ? 'block' : 'none';
});

$('npConfirm').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  if (!pendCell) return;
  const { col, vId, rType, branchId } = pendCell;
  const a = store.getState();
  const date = $('npDate').value;
  if (date) a.ensureYearVisible(date);
  const prepared = createStageNodeData(store.getState(), rType, col, {
    type: normalizeStageIconId($('npShape').value),
    topLabel: $('npTop').value.trim(),
    bottomLabel: $('npBottom').value,
    date,
    isDRS: $('npIsDRS').checked,
    drsDetail: $('npIsDRS').checked ? $('npDrsDetail').value.trim() : '',
  }, branchId);
  if (!prepared.ok) {
    alert(prepared.reason);
    return;
  }
  const base = prepared.node;
  if (rType === 'plan') a.addPlanNode({ ...base, variantId: vId });
  else if (rType === 'branch') a.addBranchNode({ ...base, branchId });
  else if (rType === 'actualBranch') a.addActualBranchNode({ ...base, branchId });
  else a.addActualNode({ ...base, variantId: vId });

  nodePopup.classList.remove('active');
  pendCell = null;
  renderAll(); persistDraftNow();
});

$('npCancel').addEventListener('click', () => {
  nodePopup.classList.remove('active');
  pendCell = null;
});

// ── Context menu ──
function showCtx(e, nodeId, rType) {
  if (isSnapshotReadOnlyMode()) return;
  ctxId = nodeId; ctxRowType = rType; ctxCell = null;
  const state = store.getState();
  const planNode = rType === 'plan' ? state.planNodes.find(n => n.id === nodeId) : null;
  const actualNode = rType === 'actual' ? state.actualNodes.find(n => n.id === nodeId) : null;
  const branchNode = rType === 'branch' ? state.branchNodes.find(n => n.id === nodeId) : null;
  const actualBranchNode = rType === 'actualBranch' ? state.actualBranchNodes.find(n => n.id === nodeId) : null;
  const mainNode = planNode || actualNode;
  const branchContext = rType === 'actual' ? 'actual' : 'plan';
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').textContent = '🌿 New Branch from here';
  $('ctxBranch').style.display = mainNode && canStartBranchAtColForContext(state, branchContext, mainNode.variantId, mainNode.col) ? 'block' : 'none';
  $('ctxMerge').style.display =
    (rType === 'branch' && isLastBranchNodeForContext(branchNode, state, 'branch')) ||
    (rType === 'actualBranch' && isLastBranchNodeForContext(actualBranchNode, state, 'actualBranch'))
      ? 'block'
      : 'none';
  $('ctxMerge').textContent = 'Merge to month';
  $('ctxPreponed').style.display = 'block';
  $('ctxPostponed').style.display = 'block';
  $('ctxDelete').style.display = 'block';
}

function showCellCtx(e) {
  e.preventDefault();
  if (isSnapshotReadOnlyMode()) return;
  const cell = e.currentTarget;
  const col = +cell.dataset.col;
  const vId = cell.dataset.vId;
  const rType = cell.dataset.rType;
  if (!canStartBranchAtColForContext(store.getState(), rType, vId, col)) {
    ctxMenu.classList.remove('active');
    return;
  }
  ctxId = null;
  ctxRowType = rType === 'actual' ? 'actualCell' : 'planCell';
  ctxCell = { col, vId, rType };
  ctxMenu.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  ctxMenu.classList.add('active');
  $('ctxBranch').textContent = '🌿 New Branch from this month';
  $('ctxBranch').style.display = 'block';
  $('ctxMerge').style.display = 'none';
  $('ctxPreponed').style.display = 'none';
  $('ctxPostponed').style.display = 'none';
  $('ctxDelete').style.display = 'none';
}

$('ctxBranch').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  ctxMenu.classList.remove('active');
  const state = store.getState();
  const isActual = ctxRowType === 'actual' || ctxRowType === 'actualCell';
  const parent = ctxId
    ? (isActual ? state.actualNodes.find(n => n.id === ctxId) : state.planNodes.find(n => n.id === ctxId))
    : null;
  const sourceCol = parent ? parent.col : ctxCell && ctxCell.col;
  const variantId = parent ? parent.variantId : ctxCell && ctxCell.vId;
  if (!variantId || !Number.isFinite(sourceCol)) return;
  if (!canStartBranchAtColForContext(state, isActual ? 'actual' : 'plan', variantId, sourceCol)) return;
  const sourceDate = (parent && parent.date) || colToDate(sourceCol, state);
  openModal('New Branch', `<div class="form-group"><label>Branch Label</label><input id="f_bl" type="text" placeholder="e.g. Gas variant"/></div>`, () => {
    const label = $('f_bl').value.trim() || 'Branch';
    const data = {
      variantId,
      parentNodeId: parent ? parent.id : '',
      sourceNodeId: parent ? parent.id : '',
      sourceCol,
      sourceDate,
      label,
    };
    if (isActual) store.getState().addActualBranch(data);
    else store.getState().addBranch(data);
    ctxCell = null;
    renderAll(); persistDraftNow();
  });
});

$('ctxMerge').addEventListener('click', e => {
  if (isSnapshotReadOnlyMode()) return;
  e.stopPropagation();
  ctxMenu.classList.remove('active');
  const isActual = ctxRowType === 'actualBranch';
  const fromNode = isActual
    ? store.getState().actualBranchNodes.find(n => n.id === ctxId)
    : store.getState().branchNodes.find(n => n.id === ctxId);
  if (!fromNode) return;
  const mergeMinMonth = colToInputMonth(fromNode.col + 1, store.getState());
  openModal('Merge Branch', `<div class="form-group"><label>Merge Month</label><input id="f_merge_month" type="month" min="${mergeMinMonth}"/></div>`, () => {
    const date = $('f_merge_month').value;
    if (!date) {
      alert('Select a merge month.');
      return false;
    }
    store.getState().ensureYearVisible(date);
    const state = store.getState();
    const branch = isActual
      ? (state.actualBranches || []).find(b => b.id === fromNode.branchId)
      : state.branches.find(b => b.id === fromNode.branchId);
    if (!branch) return;
    const col = dateToCol(date, state);
    const validation = canMergeBranchNodeToColForContext(fromNode, col, state, isActual ? 'actualBranch' : 'branch');
    if (!validation.ok) {
      alert(validation.reason);
      return false;
    }
    const targetNode = isActual
      ? findActualNodeAtCol(state, branch.variantId, col)
      : findPlanNodeAtCol(state, branch.variantId, col);
    const data = {
      fromNodeId: fromNode.id,
      fromBranchId: fromNode.branchId,
      toNodeId: targetNode ? targetNode.id : '',
      toCol: col,
      toDate: date,
    };
    if (isActual) store.getState().addActualMergeLink(data);
    else store.getState().addMergeLink(data);
    renderAll(); persistDraftNow();
    return true;
  });
});

$('ctxPreponed').addEventListener('click', () => openStageShiftModal('preponed'));
$('ctxPostponed').addEventListener('click', () => openStageShiftModal('postponed'));

function openStageShiftModal(mode) {
  if (isSnapshotReadOnlyMode()) return;
  ctxMenu.classList.remove('active');
  const state = store.getState();
  const source = findStageByContext(state, ctxRowType, ctxId);
  if (!source) return;
  const title = mode === 'preponed' ? 'Preponed Stage' : 'Postponed Stage';
  const label = mode === 'preponed' ? 'Preponed Month' : 'Postponed Month';
  const shiftBound = mode === 'preponed'
    ? `max="${colToInputMonth(source.col - 1, state)}"`
    : `min="${colToInputMonth(source.col + 1, state)}"`;
  openModal(title, `
    <div class="form-group"><label>${label}</label><input id="f_shift_month" type="month" ${shiftBound}/></div>
    <div class="form-group"><label>DRS Details</label><textarea id="f_shift_drs_detail" rows="3" placeholder="Enter DRS Details"></textarea></div>`, () => {
    const date = $('f_shift_month').value;
    const drsDetail = $('f_shift_drs_detail').value.trim();
    if (!date) {
      alert(`Select a ${mode === 'preponed' ? 'preponed' : 'postponed'} month.`);
      return false;
    }
    if (!drsDetail) {
      alert('Enter DRS Details for the shifted stage.');
      return false;
    }
    store.getState().ensureYearVisible(date);
    const nextState = store.getState();
    const targetCol = dateToCol(date, nextState);
    const validation = canAddStageShift(source, mode, targetCol);
    if (!validation.ok) {
      alert(validation.reason);
      return false;
    }
    store.getState().addStageShift({
      sourceNodeId: source.id,
      sourceContext: ctxRowType,
      mode,
      targetDate: date,
      targetCol,
      drsDetail,
    });
    renderAll(); persistDraftNow();
    return true;
  });
}

function planBottomOptions(selected) {
  const value = normalizePlanBottomLabel(selected);
  return [
    `<option value=""${value ? '' : ' selected'}>Bottom label</option>`,
    ...PLAN_BOTTOM_LABELS.map(label => `<option value="${label}"${value === label ? ' selected' : ''}>${label}</option>`),
  ].join('');
}

function openStageEditModal(node, rType) {
  if (isSnapshotReadOnlyMode()) return;
  if (!node) return;
  nodePopup.classList.remove('active');
  const isActual = isActualStageContext(rType);
  const bottomField = isPlanStageContext(rType)
    ? `<div class="form-group"><label>Bottom Label</label><select id="f_stage_bottom">${planBottomOptions(node.bottomLabel)}</select></div>`
    : '';
  openModal('Edit Stage', `
    <div class="form-group"><label>Top Label</label><input id="f_stage_top" type="text" value="${escapeHtml(node.topLabel || '')}"/></div>
    ${bottomField}
    <div class="form-group"><label>${isActual ? 'Actual Date' : 'Plan Month'}</label><input id="f_stage_date" type="${isActual ? 'date' : 'month'}" value="${escapeHtml(node.date || '')}"/></div>`, () => {
    const date = $('f_stage_date').value;
    if (date) store.getState().ensureYearVisible(date);
    const data = {
      topLabel: $('f_stage_top').value.trim(),
      bottomLabel: isPlanStageContext(rType) ? $('f_stage_bottom').value : '',
      date,
      branchId: node.branchId,
    };
    const validation = updateStageNodeData(store.getState(), rType, node.id, data);
    if (validation.ok === false) {
      alert(validation.reason);
      return false;
    }
    const a = store.getState();
    if (rType === 'plan') a.updatePlanNode(node.id, data);
    else if (rType === 'branch') a.updateBranchNode(node.id, data);
    else if (rType === 'actualBranch') a.updateActualBranchNode(node.id, data);
    else a.updateActualNode(node.id, data);
    renderAll(); persistDraftNow();
    return true;
  });
}

$('ctxDelete').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  ctxMenu.classList.remove('active');
  if (!ctxId) return;
  const a = store.getState();
  if (ctxRowType === 'plan') { a.removePlanNode(ctxId); a.removeMergeLinksForNode(ctxId); }
  else if (ctxRowType === 'branch') { a.removeBranchNode(ctxId); a.removeMergeLinksForNode(ctxId); }
  else if (ctxRowType === 'actualBranch') { a.removeActualBranchNode(ctxId); a.removeActualMergeLinksForNode(ctxId); }
  else { a.removeActualNode(ctxId); a.removeActualMergeLinksForNode(ctxId); }
  if (mergePick && mergePick.fromNodeId === ctxId) clearMergePick();
  ctxId = null;
  const s = store.getState();
  renderGrid(s); renderNodes(s); persistDraftNow();
});

document.addEventListener('click', e => {
  if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('active');
  if (mergePick && !e.target.closest('.node') && !e.target.closest('#ctxMenu')) clearMergePick();
});

// ── Merge pick ──
function setMergePick(nextPick) {
  mergePick = nextPick;
  document.body.classList.add('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint(store.getState());
}

function clearMergePick() {
  mergePick = null;
  document.body.classList.remove('merge-select-mode');
  updateMergeTargetClasses();
  renderMergeHint(store.getState());
}

function handleMergeTargetClick(e, node, rType) {
  if (isSnapshotReadOnlyMode()) return false;
  if (!mergePick) return false;
  e.preventDefault();
  e.stopPropagation();
  if (rType !== 'plan') return true;

  const state = store.getState();
  const branch = state.branches.find(b => b.id === mergePick.fromBranchId);
  if (!branch || branch.variantId !== node.variantId) return true;

  store.getState().addMergeLink({
    fromNodeId: mergePick.fromNodeId,
    fromBranchId: mergePick.fromBranchId,
    toNodeId: node.id,
  });
  clearMergePick();
  renderAll(); persistDraftNow();
  return true;
}

// ── Variants ──
$('addVariantBtn').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  const name = $('variantInput').value.trim();
  if (!name) return;
  store.getState().addVariant(name);
  $('variantInput').value = '';
  renderAll(); persistDraftNow();
});

$('variantInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !isSnapshotReadOnlyMode()) $('addVariantBtn').click();
});

window.deleteVariant = (id) => {
  if (isSnapshotReadOnlyMode()) return;
  if (!confirm('Delete this variant and all its stages?')) return;
  const branchIds = new Set(store.getState().branches.filter(b => b.variantId === id).map(b => b.id));
  store.getState().deleteVariant(id);
  if (mergePick && branchIds.has(mergePick.fromBranchId)) clearMergePick();
  renderAll(); persistDraftNow();
};

// ── Bottom table buttons ──
$('addMsRowBtn').addEventListener('click', () => { if (isSnapshotReadOnlyMode()) return; store.getState().addLeftTableRow(); renderBottomTables(); renderGrid(store.getState()); renderNodes(store.getState()); persistDraftNow(); });
$('addMsColBtn').addEventListener('click', () => { if (isSnapshotReadOnlyMode()) return; store.getState().addLeftTableCol(); renderBottomTables(); renderGrid(store.getState()); renderNodes(store.getState()); persistDraftNow(); });
$('addEopRowBtn').addEventListener('click', () => { if (isSnapshotReadOnlyMode()) return; store.getState().addRightTableRow(); renderBottomTables(); persistDraftNow(); });
const addEopColBtn = $('addEopColBtn');
addEopColBtn.hidden = true;
addEopColBtn.disabled = true;

$('copyActualBtn').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  store.getState().copyPlanToActual();
  renderAll();
  persistDraftNow();
  updateDraftStatus('Plan copied to Actual');
  setTimeout(() => updateDraftStatus(), 1400);
});

// ── Drag nodes ──
function startNodeDrag(e) {
  if (isSnapshotReadOnlyMode()) return;
  if (e.target.classList.contains('node-del')) return;
  if (e.button !== 0) return;
  if (mergePick) return;
  e.preventDefault();
  dragNode = e.currentTarget;
  const r = dragNode.getBoundingClientRect();
  dox = e.clientX - r.left; doy = e.clientY - r.top;
  dragStartX = e.clientX; dragStartY = e.clientY; nodeDragMoved = false;
  document.addEventListener('mousemove', onNodeMove);
  document.addEventListener('mouseup', onNodeUp);
}

function onNodeMove(e) {
  if (!dragNode) return;
  if (!nodeDragMoved && Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) < 4) return;
  if (!nodeDragMoved) {
    nodeDragMoved = true;
    dragNode.style.opacity = '.6';
    dragNode.style.zIndex = '50';
  }
  const grp = dragNode.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  dragNode.style.left = Math.max(0, e.clientX - gr.left - dox) + 'px';
  dragNode.style.top = Math.max(0, e.clientY - gr.top - doy) + 'px';
}

function onNodeUp(e) {
  if (!dragNode) return;
  const grp = dragNode.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  const nid = dragNode.dataset.nodeId;
  const rType = dragNode.dataset.rType;
  const state = store.getState();
  const node = findStageByContext(state, rType, nid);
  const moved = nodeDragMoved;
  const newCol = Math.max(0, Math.min(Math.floor((e.clientX - gr.left - dox + 14) / COL), totalCols(state) - 1));

  dragNode.style.opacity = '1'; dragNode.style.zIndex = '5';
  dragNode = null;
  nodeDragMoved = false;
  document.removeEventListener('mousemove', onNodeMove);
  document.removeEventListener('mouseup', onNodeUp);
  if (!moved) {
    openStageEditModal(node, rType);
    return;
  }
  const branchId = dragNode && dragNode.dataset.branchId || (node && node.branchId) || null;
  const placement = canPlaceBranchStageAtCol(store.getState(), rType, branchId, newCol);
  if (!placement.ok) {
    alert(placement.reason);
    const s = store.getState();
    renderGrid(s); renderNodes(s);
    return;
  }
  const a = store.getState();
  if (rType === 'plan') a.movePlanNode(nid, newCol);
  else if (rType === 'branch') a.moveBranchNode(nid, newCol);
  else if (rType === 'actualBranch') a.moveActualBranchNode(nid, newCol);
  else a.moveActualNode(nid, newCol);
  const s = store.getState();
  renderGrid(s); renderNodes(s); persistDraftNow();
}

// ── Drag variant labels ──
function startVLabelDrag(e) {
  if (isSnapshotReadOnlyMode()) return;
  if (e.target.classList.contains('vfl-del')) return;
  e.preventDefault();
  dragVL = e.currentTarget;
  const r = dragVL.getBoundingClientRect();
  dvox = e.clientX - r.left; dvoy = e.clientY - r.top;
  dragVL.style.zIndex = '20';
  document.addEventListener('mousemove', onVLMove);
  document.addEventListener('mouseup', onVLUp);
}

function onVLMove(e) {
  if (!dragVL) return;
  const gr = tlGrid.getBoundingClientRect();
  dragVL.style.left = (e.clientX - gr.left - dvox) + 'px';
  dragVL.style.top = (e.clientY - gr.top - dvoy) + 'px';
}

function onVLUp(e) {
  if (!dragVL) return;
  const gr = tlGrid.getBoundingClientRect();
  const key = dragVL.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - dvox,
      y: e.clientY - gr.top - dvoy,
    });
  }
  dragVL.style.zIndex = '6';
  dragVL = null;
  document.removeEventListener('mousemove', onVLMove);
  document.removeEventListener('mouseup', onVLUp);
  persistDraftNow();
}

// ── Drag remarks ──
function startRemarkDrag(e) {
  if (isSnapshotReadOnlyMode()) return;
  e.preventDefault();
  dragRemark = e.currentTarget;
  const r = dragRemark.getBoundingClientRect();
  drox = e.clientX - r.left; droy = e.clientY - r.top;
  dragRemark.style.zIndex = '25';
  document.addEventListener('mousemove', onRemarkMove);
  document.addEventListener('mouseup', onRemarkUp);
}

function onRemarkMove(e) {
  if (!dragRemark) return;
  const gr = tlGrid.getBoundingClientRect();
  dragRemark.style.left = (e.clientX - gr.left - drox) + 'px';
  dragRemark.style.top = (e.clientY - gr.top - droy) + 'px';
}

function onRemarkUp(e) {
  if (!dragRemark) return;
  const gr = tlGrid.getBoundingClientRect();
  store.getState().setRemarkPosition({
    x: e.clientX - gr.left - drox,
    y: e.clientY - gr.top - droy,
  });
  dragRemark.style.zIndex = '7';
  dragRemark = null;
  document.removeEventListener('mousemove', onRemarkMove);
  document.removeEventListener('mouseup', onRemarkUp);
  persistDraftNow();
}

// ── Drag milestone table ──
function startMilestoneTableDrag(e) {
  if (isSnapshotReadOnlyMode()) return;
  e.preventDefault();
  dragMilestoneTable = e.currentTarget;
  const r = dragMilestoneTable.getBoundingClientRect();
  dmox = e.clientX - r.left; dmoy = e.clientY - r.top;
  dragMilestoneTable.style.zIndex = '27';
  document.addEventListener('mousemove', onMilestoneTableMove);
  document.addEventListener('mouseup', onMilestoneTableUp);
}

function onMilestoneTableMove(e) {
  if (!dragMilestoneTable) return;
  const gr = tlGrid.getBoundingClientRect();
  dragMilestoneTable.style.left = (e.clientX - gr.left - dmox) + 'px';
  dragMilestoneTable.style.top = (e.clientY - gr.top - dmoy) + 'px';
}

function onMilestoneTableUp(e) {
  if (!dragMilestoneTable) return;
  const gr = tlGrid.getBoundingClientRect();
  const key = dragMilestoneTable.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - dmox,
      y: e.clientY - gr.top - dmoy,
    });
  }
  dragMilestoneTable.style.zIndex = '9';
  dragMilestoneTable = null;
  document.removeEventListener('mousemove', onMilestoneTableMove);
  document.removeEventListener('mouseup', onMilestoneTableUp);
  persistDraftNow();
}

// ── Drag DRS detail labels ──
function startDrsLabelDrag(e) {
  if (isSnapshotReadOnlyMode()) return;
  e.preventDefault();
  e.stopPropagation();
  dragDrsLabel = e.currentTarget;
  const r = dragDrsLabel.getBoundingClientRect();
  ddlx = e.clientX - r.left; ddly = e.clientY - r.top;
  dragDrsLabel.style.zIndex = '26';
  document.addEventListener('mousemove', onDrsLabelMove);
  document.addEventListener('mouseup', onDrsLabelUp);
}

function onDrsLabelMove(e) {
  if (!dragDrsLabel) return;
  const grp = dragDrsLabel.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  dragDrsLabel.style.left = (e.clientX - gr.left - ddlx) + 'px';
  dragDrsLabel.style.top = (e.clientY - gr.top - ddly) + 'px';
}

function onDrsLabelUp(e) {
  if (!dragDrsLabel) return;
  const grp = dragDrsLabel.closest('.grid-vr-grp');
  const gr = grp.getBoundingClientRect();
  const key = dragDrsLabel.dataset.labelKey;
  if (key) {
    store.getState().setLabelPosition(key, {
      x: e.clientX - gr.left - ddlx,
      y: e.clientY - gr.top - ddly,
    });
  }
  dragDrsLabel.style.zIndex = '8';
  dragDrsLabel = null;
  document.removeEventListener('mousemove', onDrsLabelMove);
  document.removeEventListener('mouseup', onDrsLabelUp);
  persistDraftNow();
}

// ── Theme ──
$('themeToggleBtn').addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
  $('themeToggleBtn').textContent = isDark ? '🌙' : '☀️';
});

// ── Add year ──
$('addYearBtn').addEventListener('click', () => {
  if (isSnapshotReadOnlyMode()) return;
  store.getState().addYear();
  renderAll(); persistDraftNow();
});

// ── Submit / Back ──
$('submitBtn').addEventListener('click', async () => {
  if (isSnapshotReadOnlyMode()) return;
  const state = store.getState();
  if (getMilestoneTableRows(state).rows.length) {
    store.getState().showMilestoneTable();
    renderAll();
    persistDraftNow();
  }
  const parsedEopItems = parseEopItems(state);
  if (!parsedEopItems.length) {
    alert('Enter at least one EOP detail or EOP date.');
    return;
  }
  parsedEopItems.forEach(item => store.getState().ensureYearVisible(item.date));
  const eopItems = parseEopItems(store.getState());
  store.getState().setEopItems(eopItems);
  store.getState().setEopDate(eopItems[0].date);
  renderAll();
  persistDraftNow();

  const draft = captureState();
  const baseline = getBaselineState();
  const submittedAt = new Date().toISOString();

  const submitBtn = $('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';
  try {
    const result = await saveDraftToDataverse(draft, baseline, submittedAt);
    const submitted = adoptProjectId(result && result.projectId, draft);
    const keys = getCurrentStorageKeys();
    writeLocalJson(keys.baseline, submitted);
    writeLocalJson(keys.draft, submitted);
    store.getState().replaceState(submitted);
    syncTimelineVersionsFromSaveResult(result);
    syncHeaderInputsFromState();
    updateDraftStatus(result && result.developmentOnly ? 'Saved locally for Dataverse' : 'Saved');
    setTimeout(() => updateDraftStatus(), 1800);
  } catch (err) {
    console.error(err);
    updateDraftStatus('Save failed');
    alert('Could not save to Dataverse. Your local draft is still saved in this browser.');
  } finally {
    submitBtn.disabled = isSnapshotReadOnlyMode();
    submitBtn.textContent = 'Submit';
  }
});

$('backBtn').addEventListener('click', () => {
  if (confirm('Go back? Unsaved changes will be lost.')) history.back();
});

// ── PDF export ──
$('exportBtn').addEventListener('click', exportPDF);
$('pdfA4Btn').addEventListener('click', exportPDF);

// ── Close popups ──
document.addEventListener('click', e => {
  if (!nodePopup.contains(e.target) && !e.target.closest('.g-cell')) {
    nodePopup.classList.remove('active');
    pendCell = null;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    nodePopup.classList.remove('active');
    ctxMenu.classList.remove('active');
    if (mergePick) clearMergePick();
  }
});

// ── Scroll sync ──
function syncScroll() {
  tlScroll.addEventListener('scroll', () => { sbRows.scrollTop = tlScroll.scrollTop; });
  sbRows.addEventListener('scroll', () => { tlScroll.scrollTop = sbRows.scrollTop; });
}

// ── Sidebar resize ──
function setupResize() {
  const handle = $('sidebarResizeHandle'), sb = $('sidebar');
  let resizing = false;
  handle.addEventListener('mousedown', () => {
    resizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (resizing) sb.style.width = Math.max(240, Math.min(560, e.clientX)) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (resizing) { resizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });
}

// ── Modal ──
function openModal(title, bodyHTML, onOk) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalCb = onOk;
  modalOverlay.classList.add('active');
  setTimeout(() => { const f = modalBody.querySelector('input'); if (f) f.focus(); }, 80);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalCb = null;
}

$('modalOk').addEventListener('click', () => {
  if (modalCb && modalCb() === false) return;
  closeModal();
});
$('modalCancel').addEventListener('click', closeModal);
$('modalClose').addEventListener('click', closeModal);
$('modalOverlay').addEventListener('click', e => { if (e.target === $('modalOverlay')) closeModal(); });

// ── Stage logo picker helper ──
function normalizeStagePickerIconId(iconId) {
  const icon = getStageIcon(iconId);
  return icon ? icon.id : getDefaultStageIconId();
}

function getStageIconPickerForSelect(selectEl) {
  if (!selectEl) return null;
  return $(`${selectEl.id}Picker`);
}

function setStageIconSelectValue(selectEl, iconId) {
  if (!selectEl) return;
  selectEl.value = normalizeStagePickerIconId(iconId);
  updateStageIconPickerSelection(selectEl, getStageIconPickerForSelect(selectEl));
}

function updateStageIconPickerSelection(selectEl, pickerEl) {
  if (!selectEl || !pickerEl) return;
  const selected = normalizeStagePickerIconId(selectEl.value);
  pickerEl.querySelectorAll('.stage-icon-option').forEach(btn => {
    const active = btn.dataset.stageIcon === selected;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function fillStageIconSelect(selectEl) {
  selectEl.innerHTML = STAGE_ICONS.map(icon => `<option value="${escapeHtml(icon.id)}">${escapeHtml(icon.label)}</option>`).join('');
  setStageIconSelectValue(selectEl, selectEl.value);
}

function setupStageIconPicker(selectEl, pickerEl) {
  if (!selectEl || !pickerEl) return;
  fillStageIconSelect(selectEl);
  pickerEl.innerHTML = STAGE_ICONS.map((icon, index) => `
    <button type="button" class="stage-icon-option" data-stage-icon="${escapeHtml(icon.id)}" title="${escapeHtml(icon.label)}" aria-label="${escapeHtml(icon.label)}">
      ${makeStageIconSvg(icon, `picker-${pickerEl.id}-${index}`)}
    </button>`).join('');
  pickerEl.addEventListener('click', e => {
    const btn = e.target.closest('.stage-icon-option');
    if (!btn) return;
    setStageIconSelectValue(selectEl, btn.dataset.stageIcon);
  });
  selectEl.addEventListener('change', () => updateStageIconPickerSelection(selectEl, pickerEl));
  updateStageIconPickerSelection(selectEl, pickerEl);
}

// ════════════════════════════════════════════════════════════════
// § 7  BOOTSTRAP
// ════════════════════════════════════════════════════════════════

store.subscribe(scheduleDraftSave);

async function bootstrap() {
  await initPersistenceState();
  bindHeader();
  setupStageIconPicker($('nodeTypeSelect'), $('nodeTypeSelectPicker'));
  setupStageIconPicker($('npShape'), $('npShapePicker'));
  refreshTimelineVersionPicker();
  renderAll();
  syncHeaderInputsFromState();
  updateDraftStatus();
  syncScroll();
  setupResize();
}

bootstrap().catch(err => {
  console.error(err);
  alert('Project Tracker failed to initialize.');
});
