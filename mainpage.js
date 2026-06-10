(function (global) {
  'use strict';

  const STORAGE_PREFIX = 'project-tracker';
  const ACTIVE_PROJECT_KEY = `${STORAGE_PREFIX}:activeProjectId`;
  const TIMELINE_VERSION_CURRENT = 'current';
  const TIMELINE_VERSION_PREFIX = 'cutoff:';
  const COL_W = 52;
  const ROH = 90;
  const YH = 34;
  const MH = 30;
  const TIMELINE_INLANE_OVERLAY_H = 190;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DEFAULT_INFO = {
    project: '',
    location: '',
    plant: '',
    type: '',
    status: '',
    published: false,
  };

  const DEFAULT_PROJECT = {
    projectId: '',
    info: DEFAULT_INFO,
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
    leftTable: { cols: [], rows: [] },
    rightTable: { cols: [], rows: [] },
    remarks: '',
    years: [],
    eopDate: '',
    eopItems: [],
    discussionDate: '',
  };


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

  const $ = id => global.document && global.document.getElementById(id);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function toBool(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const raw = text(value).toLowerCase();
    return raw === 'true' || raw === 'yes' || raw === 'published' || raw === '1';
  }

  function parseJsonValue(value, fallback) {
    if (Array.isArray(value) || (value && typeof value === 'object')) return value;
    if (!text(value)) return fallback;
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function readLocalJson(storage, key) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function normalizeMonth(value) {
    const match = text(value).match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!match) return '';
    const month = Number(match[2]);
    if (month < 1 || month > 12) return '';
    return `${match[1]}-${String(month).padStart(2, '0')}`;
  }

  function normalizeDiscussionDate(value) {
    const match = text(value).match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!match) return '';
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return '';
    if (!match[3]) return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    const day = Number(match[3]);
    const lastDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > lastDay) return '';
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function getDiscussionCutoffEndTime(value) {
    const normalized = normalizeDiscussionDate(value);
    const match = normalized.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return NaN;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = match[3] ? Number(match[3]) : new Date(year, month, 0).getDate();
    return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
  }

  function getSubmitVersionTime(version) {
    const time = Date.parse(version && version.submittedAt);
    return Number.isFinite(time) ? time : NaN;
  }

  function normalizeDiscussionCutoffDates(values) {
    return [...new Set(asArray(values)
      .map(item => normalizeDiscussionDate(typeof item === 'string' ? item : item && (item.date || item.discussionDate || item.cutoffDate)))
      .filter(Boolean))]
      .sort((a, b) => getDiscussionCutoffEndTime(b) - getDiscussionCutoffEndTime(a));
  }

  function normalizeSubmitVersion(version) {
    if (!version || typeof version !== 'object') return null;
    const submittedAt = text(version.submittedAt);
    if (!submittedAt || !Number.isFinite(Date.parse(submittedAt))) return null;
    return {
      ...clone(version),
      id: text(version.id) || `submit-${Date.parse(submittedAt)}`,
      submittedAt,
      discussionDate: normalizeDiscussionDate(version.discussionDate || (version.state && version.state.discussionDate)),
    };
  }

  function normalizeSubmitVersions(versions) {
    return asArray(versions)
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

  function parseTimelineVersionValue(value) {
    const raw = text(value);
    return raw.startsWith(TIMELINE_VERSION_PREFIX)
      ? normalizeDiscussionDate(raw.slice(TIMELINE_VERSION_PREFIX.length))
      : '';
  }

  function makeTimelineVersionValue(cutoffDate) {
    return TIMELINE_VERSION_PREFIX + normalizeDiscussionDate(cutoffDate);
  }

  function fmtDiscussionDateLabel(value) {
    const normalized = normalizeDiscussionDate(value);
    const match = normalized.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return text(value);
    const month = MONTHS[Number(match[2]) - 1] || match[2];
    return match[3] ? `${Number(match[3])} ${month} ${match[1]}` : `${month} ${match[1]}`;
  }

  function monthToIndex(month) {
    const normalized = normalizeMonth(month);
    if (!normalized) return NaN;
    const [year, monthValue] = normalized.split('-').map(Number);
    return year * 12 + monthValue - 1;
  }

  function indexToMonth(index) {
    if (!Number.isFinite(index)) return '';
    const year = Math.floor(index / 12);
    const month = index % 12;
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  function monthLabel(month) {
    const normalized = normalizeMonth(month);
    if (!normalized) return '';
    return MONTHS[Number(normalized.slice(5, 7)) - 1] || '';
  }

  function colToMonth(col, years) {
    if (!Number.isFinite(col) || col < 0 || !asArray(years).length) return '';
    const startYear = Number(years[0]);
    if (!Number.isFinite(startYear)) return '';
    return indexToMonth(startYear * 12 + col);
  }

  function statusClass(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function pickProjectArray(result) {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    return asArray(result.projects).length ? result.projects
      : asArray(result.items).length ? result.items
        : asArray(result.data).length ? result.data
          : asArray(result.value);
  }

  function unwrapProjectInput(input) {
    if (!input || typeof input !== 'object') return null;
    return input.state || input.currentState || input.projectState || input.snapshot || input.draft || input;
  }

  function normalizeYears(value) {
    return [...new Set(asArray(value)
      .map(Number)
      .filter(year => Number.isInteger(year) && year >= 1900 && year <= 2200))]
      .sort((a, b) => a - b);
  }

  function normalizeVariant(raw, fallbackIndex) {
    if (!raw || typeof raw !== 'object') return null;
    const id = text(raw.id || raw.external_id || raw.externalId || raw.variant_external_id || raw.variantId || `variant-${fallbackIndex + 1}`);
    const name = text(raw.name || raw.label || raw.variant || id || `Variant ${fallbackIndex + 1}`);
    return id ? { id, name } : null;
  }

  function normalizeStage(raw, fallbackIndex, context) {
    if (!raw || typeof raw !== 'object') return null;
    const id = text(raw.id || raw.external_id || raw.externalId || `stage-${context}-${fallbackIndex + 1}`);
    const date = text(raw.date || raw.month || raw.target_month || raw.targetMonth);
    const colValue = raw.col != null ? raw.col : raw.column_index != null ? raw.column_index : raw.columnIndex;
    const node = {
      id,
      variantId: text(raw.variantId || raw.variant_external_id || raw.variantExternalId),
      branchId: text(raw.branchId || raw.branch_external_id || raw.branchExternalId),
      col: Number.isFinite(Number(colValue)) ? Number(colValue) : undefined,
      type: text(raw.type || raw.shape || raw.icon || 'square'),
      topLabel: text(raw.topLabel || raw.top_label || raw.label || raw.name),
      bottomLabel: text(raw.bottomLabel || raw.bottom_label),
      date,
      isDRS: toBool(raw.isDRS != null ? raw.isDRS : raw.is_drs),
      drsDetail: text(raw.drsDetail || raw.drs_detail),
      sourcePlanNodeId: text(raw.sourcePlanNodeId || raw.source_plan_stage_external_id),
    };
    return id ? node : null;
  }

  function normalizeBranch(raw, fallbackIndex) {
    if (!raw || typeof raw !== 'object') return null;
    const id = text(raw.id || raw.external_id || raw.externalId || `branch-${fallbackIndex + 1}`);
    const colValue = raw.sourceCol != null ? raw.sourceCol : raw.source_column_index != null ? raw.source_column_index : raw.sourceColumnIndex;
    return {
      id,
      variantId: text(raw.variantId || raw.variant_external_id || raw.variantExternalId),
      parentNodeId: text(raw.parentNodeId || raw.parent_stage_external_id),
      sourceNodeId: text(raw.sourceNodeId || raw.source_stage_external_id || raw.parent_stage_external_id),
      sourceCol: Number.isFinite(Number(colValue)) ? Number(colValue) : undefined,
      sourceDate: text(raw.sourceDate || raw.source_month || raw.sourceMonth),
      sourcePlanBranchId: text(raw.sourcePlanBranchId || raw.source_plan_branch_external_id),
      label: text(raw.label || raw.name),
    };
  }

  function normalizeMergeLink(raw, fallbackIndex) {
    if (!raw || typeof raw !== 'object') return null;
    const id = text(raw.id || raw.external_id || raw.externalId || `merge-${fallbackIndex + 1}`);
    const colValue = raw.toCol != null ? raw.toCol : raw.target_column_index != null ? raw.target_column_index : raw.targetColumnIndex;
    return {
      id,
      fromBranchId: text(raw.fromBranchId || raw.branch_external_id || raw.branchExternalId),
      fromNodeId: text(raw.fromNodeId || raw.source_stage_external_id || raw.sourceStageExternalId),
      toNodeId: text(raw.toNodeId || raw.target_stage_external_id || raw.targetStageExternalId),
      toDate: text(raw.toDate || raw.target_month || raw.targetMonth),
      toCol: Number.isFinite(Number(colValue)) ? Number(colValue) : undefined,
    };
  }

  function normalizeShift(raw, fallbackIndex) {
    if (!raw || typeof raw !== 'object') return null;
    const colValue = raw.targetCol != null ? raw.targetCol : raw.target_column_index != null ? raw.target_column_index : raw.targetColumnIndex;
    return {
      id: text(raw.id || raw.external_id || `shift-${fallbackIndex + 1}`),
      sourceNodeId: text(raw.sourceNodeId || raw.source_stage_external_id),
      sourceContext: text(raw.sourceContext || raw.source_context || raw.context),
      mode: text(raw.mode || raw.shiftMode || raw.shift_mode).toLowerCase(),
      targetDate: text(raw.targetDate || raw.target_month || raw.targetMonth),
      targetCol: Number.isFinite(Number(colValue)) ? Number(colValue) : undefined,
      drsDetail: text(raw.drsDetail || raw.drs_detail),
    };
  }

  function normalizeEopItems(rawItems, eopDate, rightTable) {
    const items = asArray(rawItems)
      .map((item, index) => ({
        id: text(item.id || `eop-${index + 1}`),
        label: text(item.label || item.model || item.name || item.detail || `EOP ${index + 1}`),
        date: text(item.date || item.month || item.value),
      }))
      .filter(item => normalizeMonth(item.date));

    if (!items.length && normalizeMonth(eopDate)) {
      items.push({ id: 'eop-primary', label: 'EOP', date: eopDate });
    }

    if (!items.length && rightTable && Array.isArray(rightTable.cols) && Array.isArray(rightTable.rows)) {
      const dateCols = rightTable.cols
        .map((col, index) => ({ col: text(col).toLowerCase(), index }))
        .filter(item => item.col.includes('date') || item.col.includes('month'));
      rightTable.rows.forEach((row, rowIndex) => {
        dateCols.forEach(({ index }) => {
          const date = row && row[index];
          if (normalizeMonth(date)) {
            items.push({
              id: `eop-table-${rowIndex + 1}-${index + 1}`,
              label: text(row[0]) || 'EOP',
              date,
            });
          }
        });
      });
    }

    return items;
  }

  function normalizeDataversePayload(payload, fallbackId) {
    const project = payload.project || {};
    const layout = parseJsonValue(project.layout_json, {});
    const years = normalizeYears(parseJsonValue(project.years_json, []));
    const state = clone(DEFAULT_PROJECT);
    state.projectId = text(project.external_id || project.id || payload.projectId || fallbackId);
    state.info = {
      project: text(project.name || project.project || state.projectId || 'Untitled Project'),
      location: text(project.location),
      plant: text(project.plant),
      type: text(project.project_type || project.type),
      status: text(project.status),
      published: toBool(project.published),
    };
    state.variants = asArray(payload.variants).map(normalizeVariant).filter(Boolean);
    state.branches = asArray(payload.branches).filter(b => text(b.branch_context || b.context) !== 'actual').map(normalizeBranch).filter(Boolean);
    state.actualBranches = asArray(payload.branches).filter(b => text(b.branch_context || b.context) === 'actual').map(normalizeBranch).filter(Boolean);
    state.planNodes = asArray(payload.stages).filter(s => text(s.stage_context || s.context) === 'plan').map((s, i) => normalizeStage(s, i, 'plan')).filter(Boolean);
    state.actualNodes = asArray(payload.stages).filter(s => text(s.stage_context || s.context) === 'actual').map((s, i) => normalizeStage(s, i, 'actual')).filter(Boolean);
    state.branchNodes = asArray(payload.stages).filter(s => text(s.stage_context || s.context) === 'branch_plan').map((s, i) => normalizeStage(s, i, 'branch')).filter(Boolean);
    state.actualBranchNodes = asArray(payload.stages).filter(s => text(s.stage_context || s.context) === 'branch_actual').map((s, i) => normalizeStage(s, i, 'actualBranch')).filter(Boolean);
    state.mergeLinks = asArray(payload.mergeLinks || payload.merge_links).filter(l => text(l.merge_context || l.context) !== 'actual').map(normalizeMergeLink).filter(Boolean);
    state.actualMergeLinks = asArray(payload.mergeLinks || payload.merge_links).filter(l => text(l.merge_context || l.context) === 'actual').map(normalizeMergeLink).filter(Boolean);
    state.stageShifts = asArray(parseJsonValue(project.stage_shifts_json, [])).map(normalizeShift).filter(Boolean);
    state.leftTable = parseJsonValue(project.milestone_table_json, { cols: [], rows: [] });
    state.rightTable = parseJsonValue(project.eop_table_json, { cols: [], rows: [] });
    state.remarks = text(project.remarks);
    state.years = years;
    state.eopDate = text(project.eop_date);
    state.eopItems = normalizeEopItems(parseJsonValue(project.eop_dates_json, []), state.eopDate, state.rightTable);
    state.discussionDate = text(project.discussion_period_date);
    state.labelPositions = layout.labelPositions || {};
    state.remarkPosition = layout.remarkPosition || null;
    return state.projectId || state.info.project ? ensureProjectVariants(state) : null;
  }

  function normalizeProjectSnapshot(input, fallbackId) {
    const raw = unwrapProjectInput(input);
    if (!raw || typeof raw !== 'object') return null;
    if (raw.project && (raw.stages || raw.variants || raw.branches || raw.mergeLinks || raw.merge_links)) {
      return normalizeDataversePayload(raw, fallbackId);
    }

    const state = clone(DEFAULT_PROJECT);
    state.projectId = text(raw.projectId || raw.id || raw.external_id || fallbackId);
    const info = raw.info || raw.projectInfo || {};
    state.info = {
      project: text(info.project || info.name || raw.name || raw.projectName || state.projectId || 'Untitled Project'),
      location: text(info.location || raw.location),
      plant: text(info.plant || raw.plant),
      type: text(info.type || info.project_type || raw.type || raw.project_type),
      status: text(info.status || raw.status),
      published: toBool(info.published != null ? info.published : raw.published),
    };
    state.variants = asArray(raw.variants).map(normalizeVariant).filter(Boolean);
    state.planNodes = asArray(raw.planNodes).map((node, i) => normalizeStage(node, i, 'plan')).filter(Boolean);
    state.actualNodes = asArray(raw.actualNodes).map((node, i) => normalizeStage(node, i, 'actual')).filter(Boolean);
    state.branches = asArray(raw.branches).map(normalizeBranch).filter(Boolean);
    state.actualBranches = asArray(raw.actualBranches).map(normalizeBranch).filter(Boolean);
    state.branchNodes = asArray(raw.branchNodes).map((node, i) => normalizeStage(node, i, 'branch')).filter(Boolean);
    state.actualBranchNodes = asArray(raw.actualBranchNodes).map((node, i) => normalizeStage(node, i, 'actualBranch')).filter(Boolean);
    state.mergeLinks = asArray(raw.mergeLinks).map(normalizeMergeLink).filter(Boolean);
    state.actualMergeLinks = asArray(raw.actualMergeLinks).map(normalizeMergeLink).filter(Boolean);
    state.stageShifts = asArray(raw.stageShifts).map(normalizeShift).filter(Boolean);
    state.leftTable = raw.leftTable && typeof raw.leftTable === 'object' ? raw.leftTable : { cols: [], rows: [] };
    state.rightTable = raw.rightTable && typeof raw.rightTable === 'object' ? raw.rightTable : { cols: [], rows: [] };
    state.remarks = text(raw.remarks);
    state.years = normalizeYears(raw.years);
    state.eopDate = text(raw.eopDate);
    state.eopItems = normalizeEopItems(raw.eopItems, state.eopDate, state.rightTable);
    state.discussionDate = text(raw.discussionDate);
    state.labelPositions = raw.labelPositions || {};
    state.remarkPosition = raw.remarkPosition || null;
    return state.projectId || state.info.project ? ensureProjectVariants(state) : null;
  }

  function ensureProjectVariants(project) {
    const byId = new Map(asArray(project.variants).map(v => [v.id, v]));
    [
      ...asArray(project.planNodes),
      ...asArray(project.actualNodes),
      ...asArray(project.branches),
      ...asArray(project.actualBranches),
    ].forEach(item => {
      const id = text(item.variantId);
      if (id && !byId.has(id)) byId.set(id, { id, name: id });
    });
    if (!byId.size) byId.set('main', { id: 'main', name: 'Main' });
    project.variants = [...byId.values()];
    return project;
  }

  async function loadProjectsFromBridge() {
    const bridge = global.ProjectTrackerDataverse;
    if (!bridge) return null;
    const fnName = ['listProjects', 'loadProjects', 'getProjects', 'listProjectSnapshots']
      .find(name => typeof bridge[name] === 'function');
    if (!fnName) return null;
    const result = await bridge[fnName]();
    return pickProjectArray(result)
      .map((item, index) => normalizeProjectSnapshot(item, item && (item.projectId || item.id || `bridge-${index + 1}`)))
      .filter(Boolean);
  }

  async function loadProjectRecordsFromBridge() {
    const bridge = global.ProjectTrackerDataverse;
    if (!bridge) return null;
    const fnName = ['listProjects', 'loadProjects', 'getProjects', 'listProjectSnapshots']
      .find(name => typeof bridge[name] === 'function');
    if (!fnName) return null;
    const result = await bridge[fnName]();
    const records = pickProjectArray(result)
      .map((item, index) => normalizeBridgeProjectRecord(item, index))
      .filter(Boolean);
    return records.length ? records : [];
  }

  function normalizeBridgeProjectRecord(item, index) {
    const fallbackId = text(item && (item.projectId || item.id || item.external_id || item.externalId)) || `bridge-${index + 1}`;
    const draft = normalizeProjectSnapshot(item, fallbackId);
    const baseline = normalizeProjectSnapshot(item && item.baseline, fallbackId);
    const submitVersions = normalizeSubmitVersions(item && (
      item.submitVersions ||
      item.versions ||
      item.submit_versions ||
      item.projectSubmitVersions ||
      item.project_submit_versions
    ));
    const explicitCutoffs = item && (
      item.discussionCutoffDates ||
      item.cutoffDates ||
      item.discussion_cutoffs ||
      item.cutoffs
    );
    const versionCutoffs = submitVersions.map(version => (
      version.discussionDate ||
      (version.state && version.state.discussionDate)
    ));
    const cutoffDates = normalizeDiscussionCutoffDates([
      ...asArray(explicitCutoffs),
      ...versionCutoffs,
    ]);
    const projectId = text((draft && draft.projectId) || (baseline && baseline.projectId) || fallbackId);
    if (!draft && !baseline && !submitVersions.length) return null;
    return {
      projectId,
      draft: draft || baseline,
      baseline,
      submitVersions,
      cutoffDates,
    };
  }

  function loadProjectsFromLocalStorage(storage) {
    if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') return [];
    const byId = new Map();
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      const match = text(key).match(/^project-tracker:(draft|baseline):(.+)$/);
      if (!match) continue;
      const [, source, id] = match;
      const snapshot = normalizeProjectSnapshot(readLocalJson(storage, key), id);
      if (!snapshot) continue;
      const existing = byId.get(id);
      if (!existing || source === 'draft') {
        byId.set(id, { source, project: snapshot });
      }
    }
    return [...byId.values()]
      .map(item => item.project)
      .sort((a, b) => text(a.info.project).localeCompare(text(b.info.project)));
  }

  function createProjectRecord(id) {
    return {
      projectId: id,
      draft: null,
      baseline: null,
      submitVersions: [],
      cutoffDates: [],
    };
  }

  function loadProjectRecordsFromLocalStorage(storage) {
    if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') return [];
    const byId = new Map();
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      const match = text(key).match(/^project-tracker:(draft|baseline|submit-versions|discussion-cutoffs):(.+)$/);
      if (!match) continue;
      const [, source, id] = match;
      const record = byId.get(id) || createProjectRecord(id);
      const value = readLocalJson(storage, key);
      if (source === 'draft') record.draft = normalizeProjectSnapshot(value, id);
      else if (source === 'baseline') record.baseline = normalizeProjectSnapshot(value, id);
      else if (source === 'submit-versions') record.submitVersions = normalizeSubmitVersions(value);
      else if (source === 'discussion-cutoffs') record.cutoffDates = normalizeDiscussionCutoffDates(value);
      byId.set(id, record);
    }

    return [...byId.values()]
      .map(record => ({
        ...record,
        draft: record.draft || record.baseline,
        cutoffDates: normalizeDiscussionCutoffDates(record.cutoffDates),
      }))
      .filter(record => record.draft || record.submitVersions.length)
      .sort((a, b) => text((a.draft && a.draft.info.project) || a.projectId).localeCompare(text((b.draft && b.draft.info.project) || b.projectId)));
  }

  function resolveProjectsForCutoff(records, value) {
    if (value === TIMELINE_VERSION_CURRENT || !text(value)) {
      return asArray(records).map(record => record && record.draft).filter(Boolean);
    }

    const cutoffDate = parseTimelineVersionValue(value) || normalizeDiscussionDate(value);
    if (!cutoffDate) return [];
    return asArray(records).map(record => {
      const version = resolveSubmitVersionForCutoff(record && record.submitVersions, cutoffDate);
      if (!version || !version.state) return null;
      const project = normalizeProjectSnapshot(version.state, record.projectId);
      if (!project) return null;
      project.discussionDate = cutoffDate;
      return project;
    }).filter(Boolean);
  }

  function collectPortfolioCutoffDates(records) {
    return normalizeDiscussionCutoffDates(asArray(records).flatMap(record => record.cutoffDates || []));
  }

  async function loadProjectCollection() {
    const bridgeProjects = await loadProjectsFromBridge();
    if (bridgeProjects) return { projects: bridgeProjects, source: 'Dataverse' };
    return { projects: loadProjectsFromLocalStorage(global.localStorage), source: 'Local drafts' };
  }

  async function loadPortfolioData() {
    const bridgeRecords = await loadProjectRecordsFromBridge();
    if (bridgeRecords) {
      return { records: bridgeRecords, cutoffDates: collectPortfolioCutoffDates(bridgeRecords), source: 'Dataverse' };
    }
    const records = loadProjectRecordsFromLocalStorage(global.localStorage);
    return { records, cutoffDates: collectPortfolioCutoffDates(records), source: 'Local drafts' };
  }

  function addMonth(months, value) {
    const month = normalizeMonth(value);
    if (month) months.push(month);
  }

  function collectProjectMonths(project) {
    const months = [];
    asArray(project.years).forEach(year => {
      if (Number.isInteger(Number(year))) {
        addMonth(months, `${year}-01`);
        addMonth(months, `${year}-12`);
      }
    });
    [
      ...asArray(project.planNodes),
      ...asArray(project.actualNodes),
      ...asArray(project.branchNodes),
      ...asArray(project.actualBranchNodes),
    ].forEach(node => {
      addMonth(months, node.date);
      if (!normalizeMonth(node.date)) addMonth(months, colToMonth(node.col, project.years));
    });
    [
      ...asArray(project.branches),
      ...asArray(project.actualBranches),
    ].forEach(branch => {
      addMonth(months, branch.sourceDate);
      if (!normalizeMonth(branch.sourceDate)) addMonth(months, colToMonth(branch.sourceCol, project.years));
    });
    [
      ...asArray(project.mergeLinks),
      ...asArray(project.actualMergeLinks),
    ].forEach(link => {
      addMonth(months, link.toDate);
      if (!normalizeMonth(link.toDate)) addMonth(months, colToMonth(link.toCol, project.years));
    });
    asArray(project.stageShifts).forEach(shift => {
      addMonth(months, shift.targetDate);
      if (!normalizeMonth(shift.targetDate)) addMonth(months, colToMonth(shift.targetCol, project.years));
    });
    addMonth(months, project.eopDate);
    asArray(project.eopItems).forEach(item => addMonth(months, item.date));
    addMonth(months, project.discussionDate);
    return months;
  }

  function computeMonthRange(projects, today = new Date()) {
    const indexes = asArray(projects)
      .flatMap(collectProjectMonths)
      .map(monthToIndex)
      .filter(Number.isFinite);
    if (!indexes.length) {
      const year = today instanceof Date && !Number.isNaN(today.getTime()) ? today.getFullYear() : new Date().getFullYear();
      indexes.push(year * 12, year * 12 + 11);
    }
    const minYear = Math.floor(Math.min(...indexes) / 12);
    const maxYear = Math.floor(Math.max(...indexes) / 12);
    const months = [];
    for (let index = minYear * 12; index <= maxYear * 12 + 11; index += 1) {
      months.push(indexToMonth(index));
    }
    return months;
  }

  function makeMonthMap(months) {
    return new Map(months.map((month, index) => [month, index]));
  }

  function dateToGridCol(value, project, monthMap, fallbackCol) {
    let month = normalizeMonth(value);
    if (!month && Number.isFinite(fallbackCol)) month = colToMonth(fallbackCol, project.years);
    return monthMap.has(month) ? monthMap.get(month) : -1;
  }

  function stageMarker(node, kind, project, monthMap) {
    const col = dateToGridCol(node.date, project, monthMap, node.col);
    if (col < 0) return null;
    const label = text(node.topLabel || node.bottomLabel || 'Stage');
    const dateLabel = text(node.date);
    const title = [
      label,
      dateLabel,
      node.bottomLabel ? `Label: ${node.bottomLabel}` : '',
      node.isDRS && node.drsDetail ? `DRS: ${node.drsDetail}` : '',
    ].filter(Boolean).join('\n');
    return {
      col,
      kind,
      shape: text(node.type || 'square'),
      iconType: text(node.type || 'square'),
      label,
      topLabel: text(node.topLabel),
      bottomLabel: text(node.bottomLabel),
      date: dateLabel,
      sub: kind === 'actual' ? formatActualSub(node.date) : text(node.bottomLabel || monthLabel(node.date)),
      title,
      hasDrs: !!node.isDRS && !!text(node.drsDetail),
      sourceId: node.id,
      sourceNodeId: node.id,
      markerType: 'stage',
    };
  }

  function formatActualSub(value) {
    const raw = text(value);
    const match = raw.match(/^\d{4}-(\d{1,2})(?:-(\d{1,2}))?$/);
    if (!match) return '';
    const month = MONTHS[Number(match[1]) - 1] || '';
    return match[2] ? `${Number(match[2])} ${month}` : month;
  }

  function markerKindForContext(context) {
    if (context === 'actual' || context === 'actualBranch') return 'actual';
    if (context === 'branch') return 'branch';
    return 'plan';
  }

  function shiftMarker(shift, source, project, monthMap) {
    const col = dateToGridCol(shift.targetDate, project, monthMap, shift.targetCol);
    if (col < 0) return null;
    const mode = shift.mode === 'preponed' ? 'Preponed' : 'Postponed';
    return {
      col,
      kind: markerKindForContext(shift.sourceContext),
      iconType: text(source && source.type) || getDefaultStageIconId(),
      label: mode,
      topLabel: text(source && source.topLabel),
      bottomLabel: text(source && source.bottomLabel),
      date: text(shift.targetDate),
      sub: formatActualSub(shift.targetDate) || monthLabel(shift.targetDate),
      title: [
        `${mode}: ${text(source && source.topLabel) || 'Stage'}`,
        shift.targetDate,
        shift.drsDetail ? `DRS: ${shift.drsDetail}` : '',
      ].filter(Boolean).join('\n'),
      hasDrs: !!text(shift.drsDetail),
      sourceId: shift.id,
      sourceNodeId: text(shift.sourceNodeId),
      sourceContext: text(shift.sourceContext),
      shiftMode: text(shift.mode),
      markerType: 'shift',
    };
  }

  function mergeMarker(link, project, monthMap) {
    const col = dateToGridCol(link.toDate, project, monthMap, link.toCol);
    if (col < 0) return null;
    return {
      col,
      kind: 'merge',
      shape: 'diamond',
      label: 'Merge',
      sub: monthLabel(link.toDate),
      title: ['Merge target', link.toDate].filter(Boolean).join('\n'),
      markerType: 'merge',
    };
  }

  function eopMarker(item, project, monthMap) {
    const col = dateToGridCol(item.date, project, monthMap);
    if (col < 0) return null;
    return {
      col,
      kind: 'eop',
      shape: 'square',
      label: text(item.label || 'EOP'),
      sub: monthLabel(item.date),
      title: [`${text(item.label || 'EOP')}`, item.date].filter(Boolean).join('\n'),
      markerType: 'eop',
    };
  }

  function findSourceNode(project, context, id) {
    const collections = {
      plan: project.planNodes,
      branch: project.branchNodes,
      actual: project.actualNodes,
      actualBranch: project.actualBranchNodes,
    };
    return asArray(collections[context]).find(node => node.id === id) || null;
  }

  function rowShifts(project, context, nodes, monthMap) {
    const ids = new Set(asArray(nodes).map(node => node.id));
    return asArray(project.stageShifts)
      .filter(shift => shift.sourceContext === context && ids.has(shift.sourceNodeId))
      .map(shift => shiftMarker(shift, findSourceNode(project, context, shift.sourceNodeId), project, monthMap))
      .filter(Boolean);
  }

  function makeStageRow(project, variant, context, label, nodes, monthMap, extraMarkers, owner) {
    const kind = context === 'actual' || context === 'actualBranch' ? 'actual' : context === 'branch' ? 'branch' : 'plan';
    const shiftedIds = new Set(asArray(project.stageShifts)
      .filter(shift => shift.sourceContext === context)
      .map(shift => shift.sourceNodeId));
    const stageMarkers = asArray(nodes).map(node => stageMarker(node, kind, project, monthMap)).filter(Boolean);
    stageMarkers.forEach(marker => {
      marker.hasShift = shiftedIds.has(marker.sourceNodeId);
    });
    const markers = [
      ...stageMarkers,
      ...rowShifts(project, context, nodes, monthMap),
      ...asArray(extraMarkers),
    ].sort((a, b) => a.col - b.col || a.label.localeCompare(b.label));
    return {
      context,
      kind,
      label,
      variantName: variant.name,
      variantId: variant.id,
      branchId: owner && owner.branchId ? owner.branchId : '',
      rowId: owner && owner.branchId ? `${context}:${owner.branchId}` : `${context}:${variant.id}`,
      markers,
    };
  }

  function buildProjectRows(project, monthMap) {
    const rows = [];
    asArray(project.variants).forEach(variant => {
      const planNodes = asArray(project.planNodes).filter(node => node.variantId === variant.id || (variant.id === 'main' && !node.variantId));
      rows.push(makeStageRow(project, variant, 'plan', 'Plan', planNodes, monthMap));

      asArray(project.branches).filter(branch => branch.variantId === variant.id).forEach(branch => {
        const nodes = asArray(project.branchNodes).filter(node => node.branchId === branch.id);
        const sourceCol = dateToGridCol(branch.sourceDate, project, monthMap, branch.sourceCol);
        const source = sourceCol >= 0 ? [{
          col: sourceCol,
          kind: 'branch',
          shape: 'diamond',
          label: 'Branch',
          sub: monthLabel(branch.sourceDate),
          title: [`Branch start: ${branch.label || variant.name}`, branch.sourceDate].filter(Boolean).join('\n'),
          markerType: 'branch-start',
        }] : [];
        const merges = asArray(project.mergeLinks)
          .filter(link => link.fromBranchId === branch.id)
          .map(link => mergeMarker(link, project, monthMap))
          .filter(Boolean);
        rows.push(makeStageRow(project, variant, 'branch', branch.label || 'Branch', nodes, monthMap, [...source, ...merges], { branchId: branch.id }));
      });

      const actualNodes = asArray(project.actualNodes).filter(node => node.variantId === variant.id || (variant.id === 'main' && !node.variantId));
      rows.push(makeStageRow(project, variant, 'actual', 'Actual', actualNodes, monthMap));

      asArray(project.actualBranches).filter(branch => branch.variantId === variant.id).forEach(branch => {
        const nodes = asArray(project.actualBranchNodes).filter(node => node.branchId === branch.id);
        const sourceCol = dateToGridCol(branch.sourceDate, project, monthMap, branch.sourceCol);
        const source = sourceCol >= 0 ? [{
          col: sourceCol,
          kind: 'branch',
          shape: 'diamond',
          label: 'Branch',
          sub: monthLabel(branch.sourceDate),
          title: [`Actual branch start: ${branch.label || variant.name}`, branch.sourceDate].filter(Boolean).join('\n'),
          markerType: 'branch-start',
        }] : [];
        const merges = asArray(project.actualMergeLinks)
          .filter(link => link.fromBranchId === branch.id)
          .map(link => mergeMarker(link, project, monthMap))
          .filter(Boolean);
        rows.push(makeStageRow(project, variant, 'actualBranch', branch.label || 'Actual Branch', nodes, monthMap, [...source, ...merges], { branchId: branch.id }));
      });
    });

    const eopItems = normalizeEopItems(project.eopItems, project.eopDate, project.rightTable);
    if (eopItems.length) {
      rows.push({
        context: 'eop',
        kind: 'eop',
        label: 'EOP',
        variantName: 'Project',
        variantId: '',
        branchId: '',
        rowId: 'eop',
        markers: eopItems.map(item => eopMarker(item, project, monthMap)).filter(Boolean),
      });
    }

    return rows.length ? rows : [{
      context: 'plan',
      kind: 'plan',
      label: 'Plan',
      variantName: 'Main',
      markers: [],
    }, {
      context: 'actual',
      kind: 'actual',
      label: 'Actual',
      variantName: 'Main',
      markers: [],
    }];
  }

  function buildPortfolioModel(projects, today) {
    const normalizedProjects = asArray(projects).map((project, index) => normalizeProjectSnapshot(project, `project-${index + 1}`)).filter(Boolean);
    const months = computeMonthRange(normalizedProjects, today);
    const monthMap = makeMonthMap(months);
    const groups = normalizedProjects.map(project => enrichGroupGeometry({
      project,
      rows: buildProjectRows(project, monthMap),
      discussionCol: dateToGridCol(project.discussionDate, project, monthMap),
    }, monthMap, months.length * COL_W));
    return { months, monthMap, groups };
  }

  function enrichGroupGeometry(group, monthMap, totalWidth) {
    const lanes = groupLanes(group);
    group.overlays = buildTimelineOverlays(group.project, group.rows);
    const overlayHForRow = row => asArray(group.overlays).some(overlay => overlay.laneKey === row.rowId) ? TIMELINE_INLANE_OVERLAY_H : 0;
    let top = 0;
    lanes.eop.forEach(row => {
      row.top = top;
      row.height = ROH;
      row.stageY = top + ROH / 2;
      row.overlayH = 0;
      top += ROH;
    });
    lanes.plan.forEach(row => {
      row.top = top;
      row.overlayH = overlayHForRow(row);
      row.height = ROH + row.overlayH;
      row.stageY = top + ROH / 2;
      top += row.height;
    });
    group.dividerTop = top;
    group.dividerH = lanes.plan.length && lanes.actual.length ? 4 : 0;
    top += group.dividerH;
    lanes.actual.forEach(row => {
      row.top = top;
      row.overlayH = overlayHForRow(row);
      row.height = ROH + row.overlayH;
      row.stageY = top + ROH / 2;
      top += row.height;
    });
    group.height = top;
    group.relationships = buildGroupRelationships(group, monthMap);
    return group;
  }

  function markerX(marker) {
    return marker.col * COL_W + COL_W / 2;
  }

  function rowCenterY(row) {
    if (row && Number.isFinite(row.stageY)) return row.stageY;
    return (row && Number.isFinite(row.top) ? row.top : 0) + ROH / 2;
  }

  function findGroupRow(group, context, ownerId) {
    const id = text(ownerId);
    return asArray(group.rows).find(row => {
      if (row.context !== context) return false;
      if (context === 'branch' || context === 'actualBranch') return row.branchId === id;
      if (context === 'plan' || context === 'actual') return row.variantId === id || (!id && row.variantId === 'main');
      return false;
    }) || null;
  }

  function findContextRowForNode(group, context, node) {
    if (!node) return null;
    if (context === 'branch' || context === 'actualBranch') return findGroupRow(group, context, node.branchId);
    return findGroupRow(group, context, node.variantId) || findGroupRow(group, context, 'main');
  }

  function nodePoint(group, monthMap, context, node) {
    const row = findContextRowForNode(group, context, node);
    if (!row) return null;
    const col = dateToGridCol(node && node.date, group.project, monthMap, node && node.col);
    if (col < 0) return null;
    return { x: col * COL_W + COL_W / 2, y: rowCenterY(row), row };
  }

  function branchSourcePoint(group, monthMap, branch, sourceContext) {
    const source = findSourceNode(group.project, sourceContext, branch.sourceNodeId || branch.parentNodeId);
    if (source) {
      const sourcePoint = nodePoint(group, monthMap, sourceContext, source);
      if (sourcePoint) return sourcePoint;
    }
    const row = findGroupRow(group, sourceContext, branch.variantId) || findGroupRow(group, sourceContext, 'main');
    if (!row) return null;
    const col = dateToGridCol(branch.sourceDate, group.project, monthMap, branch.sourceCol);
    if (col < 0) return null;
    return { x: col * COL_W + COL_W / 2, y: rowCenterY(row), row };
  }

  function firstBranchNode(project, branchId, collection) {
    return asArray(collection)
      .filter(node => node.branchId === branchId)
      .sort((a, b) => {
        const ac = Number.isFinite(Number(a.col)) ? Number(a.col) : 0;
        const bc = Number.isFinite(Number(b.col)) ? Number(b.col) : 0;
        return ac - bc || text(a.id).localeCompare(text(b.id));
      })[0] || null;
  }

  function branchLanePoint(group, monthMap, branch, branchContext) {
    const row = findGroupRow(group, branchContext, branch.id);
    if (!row) return null;
    const col = dateToGridCol(branch.sourceDate, group.project, monthMap, branch.sourceCol);
    if (col < 0) return null;
    return { x: col * COL_W + COL_W / 2, y: rowCenterY(row), row };
  }

  function mergeTargetPoint(group, monthMap, link, branch, targetContext) {
    const targetCollection = targetContext === 'actual' ? group.project.actualNodes : group.project.planNodes;
    const target = asArray(targetCollection).find(node => node.id === link.toNodeId);
    if (target) {
      const targetPoint = nodePoint(group, monthMap, targetContext, target);
      if (targetPoint) return targetPoint;
    }
    const row = findGroupRow(group, targetContext, branch && branch.variantId) || findGroupRow(group, targetContext, 'main');
    if (!row) return null;
    const col = dateToGridCol(link.toDate, group.project, monthMap, link.toCol);
    if (col < 0) return null;
    return { x: col * COL_W + COL_W / 2, y: rowCenterY(row), row };
  }

  function buildGroupRelationships(group, monthMap) {
    const relationships = [];

    asArray(group.project.branches).forEach(branch => {
      const from = branchSourcePoint(group, monthMap, branch, 'plan');
      const first = firstBranchNode(group.project, branch.id, group.project.branchNodes);
      const to = first
        ? nodePoint(group, monthMap, 'branch', first)
        : branchLanePoint(group, monthMap, branch, 'branch');
      if (from && to) relationships.push({ type: 'branch-start', from, to });
    });

    asArray(group.project.actualBranches).forEach(branch => {
      const from = branchSourcePoint(group, monthMap, branch, 'actual');
      const first = firstBranchNode(group.project, branch.id, group.project.actualBranchNodes);
      const to = first
        ? nodePoint(group, monthMap, 'actualBranch', first)
        : branchLanePoint(group, monthMap, branch, 'actualBranch');
      if (from && to) relationships.push({ type: 'actual-branch-start', from, to });
    });

    asArray(group.project.mergeLinks).forEach(link => {
      const branch = asArray(group.project.branches).find(item => item.id === link.fromBranchId);
      const fromNode = asArray(group.project.branchNodes).find(node => node.id === link.fromNodeId && node.branchId === link.fromBranchId);
      const from = nodePoint(group, monthMap, 'branch', fromNode);
      const to = mergeTargetPoint(group, monthMap, link, branch, 'plan');
      if (from && to) relationships.push({ type: 'merge', from, to });
    });

    asArray(group.project.actualMergeLinks).forEach(link => {
      const branch = asArray(group.project.actualBranches).find(item => item.id === link.fromBranchId);
      const fromNode = asArray(group.project.actualBranchNodes).find(node => node.id === link.fromNodeId && node.branchId === link.fromBranchId);
      const from = nodePoint(group, monthMap, 'actualBranch', fromNode);
      const to = mergeTargetPoint(group, monthMap, link, branch, 'actual');
      if (from && to) relationships.push({ type: 'actual-merge', from, to });
    });

    asArray(group.project.stageShifts).forEach(shift => {
      const source = findSourceNode(group.project, shift.sourceContext, shift.sourceNodeId);
      const from = nodePoint(group, monthMap, shift.sourceContext, source);
      const targetCol = dateToGridCol(shift.targetDate, group.project, monthMap, shift.targetCol);
      if (!from || targetCol < 0) return;
      relationships.push({
        type: shift.mode === 'preponed' ? 'shift-preponed' : 'shift-postponed',
        from,
        to: { x: targetCol * COL_W + COL_W / 2, y: from.y, row: from.row },
      });
    });

    return relationships;
  }

  function getMilestoneTableRows(project) {
    const table = project.leftTable || { cols: [], rows: [] };
    const cols = asArray(table.cols).map(col => text(col));
    const rows = asArray(table.rows)
      .map(row => cols.map((_, index) => text(row && row[index])))
      .filter(row => row.some(Boolean));
    return { cols, rows };
  }

  function getPrimaryOverlayLaneKey(rows) {
    const primary = asArray(rows).find(row => row.context === 'plan' || row.context === 'branch')
      || asArray(rows).find(row => row.context === 'actual' || row.context === 'actualBranch');
    return primary ? primary.rowId : '';
  }

  function overlayLaneKeyForNode(project, rType, node) {
    if (rType === 'branch') return `branch:${text(node && node.branchId)}`;
    if (rType === 'actual') return `actual:${text((node && node.variantId) || 'main')}`;
    if (rType === 'actualBranch') return `actualBranch:${text(node && node.branchId)}`;
    return `plan:${text((node && node.variantId) || 'main')}`;
  }

  function collectDrsSummaryItemsByLane(project) {
    const byLane = {};
    [
      ['plan', asArray(project.planNodes)],
      ['branch', asArray(project.branchNodes)],
      ['actual', asArray(project.actualNodes)],
      ['actualBranch', asArray(project.actualBranchNodes)],
    ].forEach(function (pair) {
      var rType = pair[0], nodes = pair[1];
      nodes.forEach(function (node) {
        var detail = String(node.drsDetail || '').trim();
        if (!node.isDRS || !detail) return;
        var laneKey = overlayLaneKeyForNode(project, rType, node);
        if (!byLane[laneKey]) byLane[laneKey] = [];
        byLane[laneKey].push({ label: stageSummaryLabel(project, rType, node), text: detail });
      });
    });
    asArray(project.stageShifts).forEach(function (shift) {
      var detail = String(shift.drsDetail || '').trim();
      if (!detail) return;
      var source = findSourceNode(project, shift.sourceContext, shift.sourceNodeId);
      var laneKey = source ? overlayLaneKeyForNode(project, shift.sourceContext, source) : '';
      if (!laneKey) return;
      var mode = shift.mode === 'preponed' ? 'Preponed Shift' : 'Postponed Shift';
      var label = source
        ? [mode, stageSummaryLabel(project, shift.sourceContext, source)].filter(Boolean).join(' / ')
        : mode;
      if (!byLane[laneKey]) byLane[laneKey] = [];
      byLane[laneKey].push({ label: label, text: detail });
    });
    return byLane;
  }

  function buildTimelineOverlays(project, rows) {
    const overlays = [];
    const primaryLaneKey = getPrimaryOverlayLaneKey(rows);
    const remarkLines = splitRemarkLines(project.remarks);
    if (primaryLaneKey && remarkLines.length) {
      overlays.push({
        type: 'remarks',
        title: 'Remarks',
        laneKey: primaryLaneKey,
        className: 'timeline-summary-box canvas-remark remarks-summary-box',
        items: remarkLines.map(item => ({ text: item })),
      });
    }

    const drsByLane = collectDrsSummaryItemsByLane(project);
    Object.keys(drsByLane).forEach(laneKey => {
      if (!drsByLane[laneKey].length) return;
      overlays.push({
        type: 'drs',
        title: 'DRS Details',
        laneKey,
        className: 'timeline-summary-box drs-summary-box',
        items: drsByLane[laneKey],
      });
    });

    const milestone = getMilestoneTableRows(project);
    if (primaryLaneKey && milestone.cols.length && milestone.rows.length) {
      overlays.push({
        type: 'milestone',
        title: 'Milestone Table',
        laneKey: primaryLaneKey,
        className: 'milestone-grid-table',
        table: milestone,
      });
    }

    return overlays;
  }

  let portfolioData = { records: [], cutoffDates: [], source: '' };
  let selectedTimelineVersion = TIMELINE_VERSION_CURRENT;

  function createEl(tag, className, textValue) {
    const el = global.document.createElement(tag);
    if (className) el.className = className;
    if (textValue != null) el.textContent = textValue;
    return el;
  }

  function laneClass(row) {
    if (row.kind === 'eop') return 'eop-row';
    if (row.context === 'plan') return 'plan-sub';
    if (row.context === 'branch') return 'branch-sub';
    if (row.context === 'actual') return 'actual-sub';
    if (row.context === 'actualBranch') return 'actual-sub actual-branch-sub';
    return 'plan-sub';
  }

  function nodeKindClass(kind) {
    if (kind === 'actual') return 'actual-node';
    if (kind === 'branch') return 'branch-node';
    if (kind === 'merge') return 'merge-node';
    if (kind === 'shift-preponed' || kind === 'shift-postponed') return 'shift-node';
    return 'plan-node';
  }

  function connectorColor(kind) {
    if (kind === 'actual') return 'var(--actual)';
    if (kind === 'branch') return 'var(--branch)';
    return 'var(--plan)';
  }

  function groupLanes(group) {
    const eop = group.rows.filter(row => row.kind === 'eop');
    const plan = group.rows.filter(row => row.context === 'plan' || row.context === 'branch');
    const actual = group.rows.filter(row => row.context === 'actual' || row.context === 'actualBranch');
    return { eop, plan, actual };
  }

  function renderHeaders(model) {
    const yearHeader = $('yearHeader');
    const monthHeader = $('monthHeader');
    if (!yearHeader || !monthHeader) return;
    yearHeader.replaceChildren();
    monthHeader.replaceChildren();
    const totalW = model.months.length * COL_W;
    yearHeader.style.width = `${totalW}px`;
    monthHeader.style.width = `${totalW}px`;

    const years = [];
    model.months.forEach(month => {
      const year = month.slice(0, 4);
      const current = years[years.length - 1];
      if (current && current.year === year) current.count += 1;
      else years.push({ year, count: 1 });
    });

    years.forEach(({ year, count }) => {
      const block = createEl('div', 'yr-block', year);
      block.style.width = `${count * COL_W}px`;
      yearHeader.appendChild(block);
    });

    model.months.forEach(month => {
      monthHeader.appendChild(createEl('div', 'mo-cell', String(Number(month.slice(5, 7)))));
    });
  }

  function renderSidebar(model) {
    const sbRows = $('sbRows');
    if (!sbRows) return;
    sbRows.replaceChildren();

    model.groups.forEach((group, gi) => {
      const lanes = groupLanes(group);
      const eopH = lanes.eop.reduce((sum, row) => sum + (row.height || ROH), 0);
      const planH = lanes.plan.reduce((sum, row) => sum + (row.height || ROH), 0);
      const actualH = lanes.actual.reduce((sum, row) => sum + (row.height || ROH), 0);
      const dividerH = (planH && actualH) ? 4 : 0;
      const totalH = group.height || (eopH + planH + dividerH + actualH);

      const row = createEl('div', 'sidebar-row');
      row.style.height = `${totalH}px`;

      const sno = createEl('div', 'sr-cell sno', String(gi + 1));
      sno.style.height = `${totalH}px`;

      const proj = createEl('div', 'sr-cell proj');
      proj.style.height = `${totalH}px`;
      proj.appendChild(createEl('span', 'vr-name', group.project.info.project || group.project.projectId || 'Untitled Project'));
      if (group.project.projectId) {
        const btn = createEl('button', 'proj-open-btn', 'Open');
        btn.type = 'button';
        btn.dataset.projectId = group.project.projectId;
        btn.addEventListener('click', () => openProject(group.project));
        proj.appendChild(btn);
      }

      const loc = createEl('div', 'sr-cell loc', group.project.info.location || '—');
      loc.style.height = `${totalH}px`;
      const plant = createEl('div', 'sr-cell plant', group.project.info.plant || '—');
      plant.style.height = `${totalH}px`;

      const pa = createEl('div', 'sr-cell pa');
      pa.style.height = `${totalH}px`;
      if (eopH) {
        const sp = createEl('div', 'pa-eop-spacer', 'EOP');
        sp.style.height = `${eopH}px`;
        pa.appendChild(sp);
      }
      if (planH) {
        const p = createEl('div', 'pa-plan', 'P');
        p.style.height = `${planH}px`;
        pa.appendChild(p);
      }
      if (dividerH) {
        const d = createEl('div', 'pa-divider');
        d.style.height = `${dividerH}px`;
        pa.appendChild(d);
      }
      if (actualH) {
        const a = createEl('div', 'pa-actual', 'A');
        a.style.height = `${actualH}px`;
        pa.appendChild(a);
      }

      row.append(sno, proj, loc, plant, pa);
      sbRows.appendChild(row);

      if (gi < model.groups.length - 1) {
        const sep = createEl('div', 'grp-sep');
        sep.style.height = '2px';
        sbRows.appendChild(sep);
      }
    });
  }

  function addDiscussionBands(rowEl, discussionCol) {
    if (!Number.isFinite(discussionCol) || discussionCol < 0) return;
    [
      { offset: -1, cls: 'prev' },
      { offset: 0, cls: 'current' },
      { offset: 1, cls: 'next' },
    ].forEach(({ offset, cls }) => {
      const col = discussionCol + offset;
      if (col < 0) return;
      const band = createEl('div', `discussion-band ${cls}`);
      band.style.left = `${col * COL_W}px`;
      rowEl.appendChild(band);
    });
  }

  function addConnectors(rowEl, row) {
    const points = row.markers
      .filter(marker => marker.markerType === 'stage')
      .sort((a, b) => a.col - b.col);
    for (let i = 1; i < points.length; i += 1) {
      const left = markerX(points[i - 1]);
      const right = markerX(points[i]);
      if (right <= left) continue;
      const line = createEl('div', 'tl-line');
      line.style.left = `${left}px`;
      line.style.top = `${ROH / 2 - 1}px`;
      line.style.width = `${right - left}px`;
      line.style.background = connectorColor(row.kind);
      rowEl.appendChild(line);
    }
  }

  function addFloatLabel(rowEl, row) {
    if (row.context === 'branch' || row.context === 'actualBranch') {
      const pill = createEl('div', `branch-div-pill${row.context === 'actualBranch' ? ' actual-branch-pill' : ''}`, `↳ ${row.label || 'Branch'}`);
      pill.style.top = `${ROH / 2 - 12}px`;
      rowEl.appendChild(pill);
      return;
    }
    if (!row.variantName) return;
    const cls = row.kind === 'actual' ? 'vr-float-label actual-vr-label' : 'vr-float-label';
    const pill = createEl('div', cls, row.variantName);
    pill.style.left = '10px';
    pill.style.top = `${ROH / 2 - 12}px`;
    rowEl.appendChild(pill);
  }

  function addNode(rowEl, marker) {
    const shiftClass = marker.markerType === 'shift' ? ` shifted-node shifted-${marker.shiftMode || 'postponed'}` : '';
    const el = createEl('div', `node ${nodeKindClass(marker.kind)}${shiftClass}${marker.hasDrs ? ' has-drs' : ''}`);
    el.style.left = `${markerX(marker) - 14}px`;
    el.style.top = `${ROH / 2 - 14}px`;
    el.title = marker.title || marker.label || '';

    const iconId = marker.markerType === 'stage' || marker.markerType === 'shift' ? marker.iconType : getDefaultStageIconId();
    const instanceId = `mp-${marker.sourceId || `${marker.col}-${marker.kind}`}`;
    const topLabel = marker.markerType === 'stage' ? marker.topLabel : marker.label;
    const bottomLabel = marker.markerType === 'stage' ? marker.bottomLabel : marker.sub;
    const parts = [];
    if (topLabel) parts.push(`<span class="node-label-top">${escapeHtml(topLabel)}</span>`);
    parts.push(getStageVisualMarkup(iconId, instanceId));
    if (bottomLabel) parts.push(`<span class="node-label-bottom">${escapeHtml(bottomLabel)}</span>`);
    if (marker.kind === 'actual' && marker.date) {
      parts.push(`<span class="node-date">${escapeHtml(formatActualSub(marker.date) || marker.date)}</span>`);
    }
    if (marker.hasShift) parts.push('<span class="node-shift-cross">×</span>');
    el.innerHTML = parts.join('');
    rowEl.appendChild(el);
  }

  function addEopVisuals(rowEl, row) {
    const markers = row.markers.filter(marker => marker.col >= 0).sort((a, b) => a.col - b.col);
    if (!markers.length) return;
    const y = ROH / 2;
    const maxX = Math.max(...markers.map(markerX));
    const line = createEl('div', 'eop-line');
    line.style.left = '0';
    line.style.top = `${y - 1}px`;
    line.style.width = `${maxX}px`;
    rowEl.appendChild(line);

    markers.forEach(marker => {
      const x = markerX(marker);
      const mark = createEl('div', 'eop-x', 'X');
      mark.style.left = `${x - 8}px`;
      mark.style.top = `${y - 12}px`;
      mark.title = [marker.label, marker.sub].filter(Boolean).join(' - ');
      rowEl.appendChild(mark);
      if (marker.label) {
        const label = createEl('div', 'eop-label', marker.label);
        label.style.left = `${x + 9}px`;
        label.style.top = `${y + 8}px`;
        rowEl.appendChild(label);
      }
    });
  }

  /* ── Remarks / DRS / Milestone helpers ── */

  function splitRemarkLines(value) {
    return String(value || '').split(/[\r\n\u2028\u2029]+/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function getVariantName(project, variantId) {
    var v = asArray(project.variants).find(function (v) { return v.id === variantId; });
    return v ? v.name : '';
  }

  function getBranchLabel(project, rType, branchId) {
    var branches = rType === 'actualBranch' ? asArray(project.actualBranches) : asArray(project.branches);
    var b = branches.find(function (b) { return b.id === branchId; });
    return b ? b.label : '';
  }

  function stageContextLabel(rType) {
    if (rType === 'plan') return 'Plan';
    if (rType === 'branch') return 'Branch';
    if (rType === 'actual') return 'Actual';
    if (rType === 'actualBranch') return 'Actual Branch';
    return '';
  }

  function stageSummaryLabel(project, rType, node) {
    var owner = (rType === 'plan' || rType === 'actual')
      ? getVariantName(project, node && node.variantId)
      : getBranchLabel(project, rType, node && node.branchId);
    var name = (node && (node.topLabel || node.bottomLabel || node.date || node.id)) || '';
    return [stageContextLabel(rType), owner, name].filter(Boolean).join(' / ');
  }

  function collectDrsSummaryItems(project) {
    var items = [];
    [
      ['plan', asArray(project.planNodes)],
      ['branch', asArray(project.branchNodes)],
      ['actual', asArray(project.actualNodes)],
      ['actualBranch', asArray(project.actualBranchNodes)],
    ].forEach(function (pair) {
      var rType = pair[0], nodes = pair[1];
      nodes.forEach(function (node) {
        var detail = String(node.drsDetail || '').trim();
        if (!node.isDRS || !detail) return;
        items.push({ label: stageSummaryLabel(project, rType, node), text: detail });
      });
    });
    asArray(project.stageShifts).forEach(function (shift) {
      var detail = String(shift.drsDetail || '').trim();
      if (!detail) return;
      var source = findSourceNode(project, shift.sourceContext, shift.sourceNodeId);
      var mode = shift.mode === 'preponed' ? 'Preponed Shift' : 'Postponed Shift';
      var label = source
        ? [mode, stageSummaryLabel(project, shift.sourceContext, source)].filter(Boolean).join(' / ')
        : mode;
      items.push({ label: label, text: detail });
    });
    return items;
  }

  function renderSummaryOverlay(grpEl, overlay) {
    const el = createEl('div', overlay.className);
    el.appendChild(createEl('div', 'timeline-summary-title', overlay.title));
    const list = global.document.createElement('ol');
    list.className = 'timeline-summary-list';
    asArray(overlay.items).forEach(item => {
      const li = global.document.createElement('li');
      li.textContent = item.label ? `${item.label}: ${item.text}` : item.text;
      list.appendChild(li);
    });
    el.appendChild(list);
    grpEl.appendChild(el);
  }

  function renderMilestoneOverlay(grpEl, overlay) {
    const el = createEl('div', overlay.className);
    el.appendChild(createEl('div', 'milestone-grid-title', overlay.title));

    const table = global.document.createElement('table');
    const thead = global.document.createElement('thead');
    const htr = global.document.createElement('tr');
    asArray(overlay.table && overlay.table.cols).forEach(col => {
      const th = global.document.createElement('th');
      th.textContent = col;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = global.document.createElement('tbody');
    asArray(overlay.table && overlay.table.rows).forEach(row => {
      const tr = global.document.createElement('tr');
      asArray(row).forEach(cell => {
        const td = global.document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    el.appendChild(table);
    grpEl.appendChild(el);
  }

  function renderTimelineInLaneOverlays(rowEl, group, row) {
    const overlays = asArray(group.overlays).filter(overlay => overlay.laneKey === row.rowId);
    if (!overlays.length) return;
    const wrap = createEl('div', 'timeline-inlane-overlays');
    wrap.style.top = `${ROH}px`;
    wrap.style.height = `${row.overlayH || TIMELINE_INLANE_OVERLAY_H}px`;
    overlays.forEach(overlay => {
      if (overlay.type === 'milestone') renderMilestoneOverlay(wrap, overlay);
      else renderSummaryOverlay(wrap, overlay);
    });
    rowEl.appendChild(wrap);
  }

  function makeRelationshipSvg(width, height, suffix) {
    const svg = global.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tl-relationship-svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = `
      <defs>
        <marker id="branchStartArrow-${suffix}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 Z" fill="#00c9b1"></path>
        </marker>
        <marker id="actualBranchStartArrow-${suffix}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 Z" fill="#f97316"></path>
        </marker>
        <marker id="preponedOpenArrow-${suffix}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,1 L8,5 L0,9" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
        </marker>
        <marker id="postponedOpenArrow-${suffix}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,1 L8,5 L0,9" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
        </marker>
      </defs>`;
    return svg;
  }

  function appendSvgPath(svg, className, d, markerId) {
    const path = global.document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', className);
    path.setAttribute('d', d);
    if (markerId) path.setAttribute('marker-end', `url(#${markerId})`);
    svg.appendChild(path);
  }

  function renderRelationshipSvg(grpEl, group, width, suffix) {
    const relationships = asArray(group.relationships);
    if (!relationships.length) return;
    const svg = makeRelationshipSvg(width, group.height, suffix);

    relationships.forEach(link => {
      const from = link.from;
      const to = link.to;
      if (!from || !to) return;
      if (link.type === 'branch-start') {
        appendSvgPath(svg, 'branch-start-arrow', `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`, `branchStartArrow-${suffix}`);
      } else if (link.type === 'actual-branch-start') {
        appendSvgPath(svg, 'actual-branch-start-arrow', `M ${from.x} ${from.y} L ${from.x} ${to.y} L ${to.x} ${to.y}`, `actualBranchStartArrow-${suffix}`);
      } else if (link.type === 'merge') {
        appendSvgPath(svg, 'merge-link-arrow', `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`);
      } else if (link.type === 'actual-merge') {
        appendSvgPath(svg, 'actual-merge-link-arrow', `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y}`);
      } else if (link.type === 'shift-preponed' || link.type === 'shift-postponed') {
        const mode = link.type === 'shift-preponed' ? 'preponed' : 'postponed';
        const midX = from.x + (to.x - from.x) / 2;
        const archY = Math.min(from.y, to.y) - 30;
        const d = `M ${from.x} ${from.y} Q ${midX} ${archY} ${to.x} ${to.y}`;
        appendSvgPath(svg, 'stage-shift-normal-line', `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
        appendSvgPath(svg, 'stage-shift-arrow-outline', d);
        appendSvgPath(svg, `stage-shift-arrow ${mode}-shift-arrow`, d, `${mode}OpenArrow-${suffix}`);
      }
    });

    grpEl.appendChild(svg);
  }

  function makeLaneRow(row, group, model) {
    const sr = createEl('div', `grid-sub-row ${laneClass(row)}`);
    sr.style.width = `${model.months.length * COL_W}px`;
    sr.style.height = `${row.height || ROH}px`;
    for (let col = 0; col < model.months.length; col += 1) {
      sr.appendChild(createEl('div', 'g-cell'));
    }
    addDiscussionBands(sr, group.discussionCol);
    if (row.kind === 'eop') {
      addEopVisuals(sr, row);
    } else {
      addConnectors(sr, row);
      addFloatLabel(sr, row);
      row.markers.forEach(marker => addNode(sr, marker));
      renderTimelineInLaneOverlays(sr, group, row);
    }
    return sr;
  }

  function renderGrid(model) {
    const tlGrid = $('tlGrid');
    if (!tlGrid) return;
    tlGrid.replaceChildren();
    const totalW = model.months.length * COL_W;
    tlGrid.style.width = `${totalW}px`;

    model.groups.forEach((group, gi) => {
      const lanes = groupLanes(group);
      const grp = createEl('div', 'grid-vr-grp');
      grp.style.width = `${totalW}px`;
      grp.style.height = `${group.height}px`;

      lanes.eop.forEach(row => grp.appendChild(makeLaneRow(row, group, model)));
      lanes.plan.forEach(row => grp.appendChild(makeLaneRow(row, group, model)));
      if (lanes.plan.length && lanes.actual.length) {
        const dv = createEl('div', 'pa-grid-div');
        dv.style.width = `${totalW}px`;
        grp.appendChild(dv);
      }
      lanes.actual.forEach(row => grp.appendChild(makeLaneRow(row, group, model)));

      renderRelationshipSvg(grp, group, totalW, `mp-${gi}`);

      tlGrid.appendChild(grp);

      if (gi < model.groups.length - 1) {
        const sep = createEl('div', 'grp-sep');
        sep.style.width = `${totalW}px`;
        sep.style.height = '2px';
        tlGrid.appendChild(sep);
      }
    });
  }

  function syncScroll() {
    const tlScroll = $('tlScroll');
    const sbRows = $('sbRows');
    if (!tlScroll || !sbRows) return;
    if (tlScroll._mpScrollBound) return;
    tlScroll._mpScrollBound = true;
    tlScroll.addEventListener('scroll', () => {
      sbRows.scrollTop = tlScroll.scrollTop;
    });
  }

  function render(model) {
    renderHeaders(model);
    renderSidebar(model);
    renderGrid(model);
    syncScroll();
  }

  function populateCutoffSelect(cutoffDates) {
    const select = $('cutoffSelect');
    if (!select) return;
    const currentValue = selectedTimelineVersion;
    select.replaceChildren();
    const current = createEl('option', '', 'Current');
    current.value = TIMELINE_VERSION_CURRENT;
    select.appendChild(current);
    normalizeDiscussionCutoffDates(cutoffDates).forEach(cutoffDate => {
      const option = createEl('option', '', fmtDiscussionDateLabel(cutoffDate));
      option.value = makeTimelineVersionValue(cutoffDate);
      select.appendChild(option);
    });
    select.value = [...select.options].some(option => option.value === currentValue)
      ? currentValue
      : TIMELINE_VERSION_CURRENT;
    selectedTimelineVersion = select.value;
  }

  function bindCutoffSelect() {
    const select = $('cutoffSelect');
    if (!select || select._mpCutoffBound) return;
    select._mpCutoffBound = true;
    select.addEventListener('change', () => {
      selectedTimelineVersion = select.value || TIMELINE_VERSION_CURRENT;
      renderForSelectedVersion();
    });
  }

  function setEmptyState(message) {
    const panel = $('emptyState');
    if (!panel || typeof panel.querySelector !== 'function') return;
    const span = panel.querySelector('span');
    if (span) span.textContent = message;
  }

  function renderForSelectedVersion() {
    const projects = resolveProjectsForCutoff(portfolioData.records, selectedTimelineVersion);
    if (!projects.length) {
      setVisible('mainGrid', false);
      setVisible('pageToolbar', true);
      setVisible('emptyState', true);
      setEmptyState(selectedTimelineVersion === TIMELINE_VERSION_CURRENT
        ? 'Create or submit a project from the edit page, then return here to view it in the shared timeline.'
        : 'No submitted project snapshots exist for the selected cutoff date.');
      return;
    }
    setVisible('emptyState', false);
    render(buildPortfolioModel(projects));
    setVisible('mainGrid', true);
    setVisible('pageToolbar', true);
  }

  async function seedDemoIfEmpty() {
    if (portfolioData.records.length) return;
    const demo = global.ProjectTrackerMultiDemo;
    if (!demo || typeof demo.seed !== 'function') return;
    demo.seed({ reload: false });
    portfolioData = await loadPortfolioData();
  }

  function setVisible(id, visible) {
    const el = $(id);
    if (el) el.hidden = !visible;
  }

  function openProject(project) {
    if (!project || !project.projectId) return;
    try {
      global.localStorage.setItem(ACTIVE_PROJECT_KEY, project.projectId);
    } catch (err) {
      // Navigation can still proceed with the query string.
    }
    const target = `index.html?projectId=${encodeURIComponent(project.projectId)}`;
    global.location.href = target;
  }

  async function init() {
    setVisible('loadingState', true);
    setVisible('emptyState', false);
    setVisible('errorState', false);
    setVisible('pageToolbar', false);
    setVisible('mainGrid', false);
    try {
      portfolioData = await loadPortfolioData();
      await seedDemoIfEmpty();
      if (!portfolioData.records.length) {
        setVisible('loadingState', false);
        setVisible('emptyState', true);
        setEmptyState('Create or submit a project from the edit page, then return here to view it in the shared timeline.');
        return;
      }
      populateCutoffSelect(portfolioData.cutoffDates);
      bindCutoffSelect();
      setVisible('loadingState', false);
      renderForSelectedVersion();
    } catch (err) {
      setVisible('loadingState', false);
      setVisible('errorState', true);
      setText($('errorText'), err && err.message ? err.message : 'An unexpected error occurred.');
    }
  }

  global.MainPageTimeline = {
    normalizeProjectSnapshot,
    normalizeDataversePayload,
    normalizeBridgeProjectRecord,
    loadProjectsFromLocalStorage,
    loadProjectRecordsFromLocalStorage,
    normalizeDiscussionCutoffDates,
    resolveSubmitVersionForCutoff,
    resolveProjectsForCutoff,
    collectPortfolioCutoffDates,
    collectProjectMonths,
    computeMonthRange,
    buildPortfolioModel,
    normalizeEopItems,
    monthToIndex,
    indexToMonth,
    colToMonth,
  };

  if (global.document && typeof global.document.addEventListener === 'function') {
    global.document.addEventListener('DOMContentLoaded', init);
  }
})(typeof window !== 'undefined' ? window : globalThis);
