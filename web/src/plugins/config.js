import body_0 from "../assets/imgs/themes/body_0.png";
import content_0 from "../assets/imgs/themes/content_0.png";
import popup_0 from "../assets/imgs/themes/popup_0.png";
import body_1 from "../assets/imgs/themes/body_1.png";
import content_1 from "../assets/imgs/themes/content_1.png";
import popup_1 from "../assets/imgs/themes/popup_1.png";
import body_2 from "../assets/imgs/themes/body_2.png";
import content_2 from "../assets/imgs/themes/content_2.png";
import popup_2 from "../assets/imgs/themes/popup_2.png";
import body_3 from "../assets/imgs/themes/body_3.png";
import content_3 from "../assets/imgs/themes/content_3.png";
import popup_3 from "../assets/imgs/themes/popup_3.png";
import body_5 from "../assets/imgs/themes/body_5.png";
import content_5 from "../assets/imgs/themes/content_5.png";
import popup_5 from "../assets/imgs/themes/popup_5.png";
import body_6 from "../assets/imgs/themes/body_6.png";
import content_6 from "../assets/imgs/themes/content_6.png";
// import popup_6 from "../assets/imgs/themes/popup_6.png";

const settings = {
  shelfConfig: {
    showBookGroup: -1
  },
  searchConfig: {
    searchType: "multi",
    bookSourceGroup: "",
    bookSourceUrl: "",
    concurrentCount: 24
  },
  config: {
    theme: 0,
    font: 0,
    fontSize: 18,
    fontWeight: 400,
    themeType: "day",
    readMethod: "上下滑动",
    clickMethod: "自动",
    animateMSTime: 300, // 翻页动画时长
    readWidth: 800,
    lineHeight: 1.8, // 行高
    paragraphSpace: 0.2, // 段间距
    autoTheme: true, // 自动切换主题
    fontColor: "",
    nightFontColor: "",
    selectionAction: "过滤弹窗",
    pageMode: "自适应",
    pageType: "正常",
    autoReadingLineTime: 1000
  },
  speechVoiceConfig: {
    voiceName: "",
    speechRate: 1,
    speechPitch: 1
  },
  defaultNightTheme: 6,
  themes: [
    {
      body: "url(" + body_0 + ") repeat",
      content: "url(" + content_0 + ") repeat",
      popup: "url(" + popup_0 + ") repeat"
    },
    {
      body: "url(" + body_1 + ") repeat",
      content: "url(" + content_1 + ") repeat",
      popup: "url(" + popup_1 + ") repeat"
    },
    {
      body: "url(" + body_2 + ") repeat",
      content: "url(" + content_2 + ") repeat",
      popup: "url(" + popup_2 + ") repeat"
    },
    {
      body: "url(" + body_3 + ") repeat",
      content: "url(" + content_3 + ") repeat",
      popup: "url(" + popup_3 + ") repeat"
    },
    {
      body: "#ebcece repeat",
      content: "#f5e4e4 repeat",
      popup: "#faeceb repeat"
    },
    {
      body: "url(" + body_5 + ") repeat",
      content: "url(" + content_5 + ") repeat",
      popup: "url(" + popup_5 + ") repeat"
    },
    {
      body: "url(" + body_6 + ") repeat",
      content: "url(" + content_6 + ") repeat",
      popup: "#121212"
    },
    {
      body: "#f7f7f7 repeat",
      content: "#fff repeat",
      popup: "#f7f7f7 repeat"
    }
  ],
  fonts: [
    {},
    // 黑体
    {
      fontFamily:
        '"reader-ht", "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", sans-serif'
    },
    // 楷体
    {
      fontFamily:
        '"reader-kt", "Kaiti SC", "STKaiti", "KaiTi", "楷体", "AR PL UKai CN", serif'
    },
    // 宋体
    {
      fontFamily:
        '"reader-st", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "Source Han Serif CN", "STSong", "SimSun", "宋体", serif'
    },
    // 仿宋
    {
      fontFamily:
        '"reader-fs", "STFangsong", "FangSong", "FangSong_GB2312", "仿宋", serif'
    }
  ],
  maxReadWidth: Math.floor(window.innerWidth / 160) * 160,
  minReadWidth: Math.min(Math.floor(window.innerWidth / 160), 4) * 160
};
export const errorTypeList = [
  "UnknownHostException",
  "ConnectException: Failed to connect",
  "SocketException: Connection reset",
  "SSLHandshakeException",
  // 307 是重定向，不代表书源失效，不应判定为失效书源
  // "responseCode: 307",
  "responseCode: 400",
  "responseCode: 403",
  "responseCode: 404",
  "responseCode: 500",
  "responseCode: 502",
  "responseCode: 503",
  "responseCode: 504",
  "responseCode: 513"
];
export default settings;
