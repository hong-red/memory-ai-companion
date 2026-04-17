// API 基础配置
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'http://81.70.191.44:3000/api';

// 默认配置
const DEFAULT_CONFIG = {
  apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
  model: 'moonshot-v1-8k'
};

// 心情选项
const MOOD_OPTIONS = [
  { value: 'happy', label: '😊 开心' },
  { value: 'calm', label: '😌 平静' },
  { value: 'excited', label: '🤩 兴奋' },
  { value: 'tired', label: '😴 疲惫' },
  { value: 'sad', label: '😢 难过' },
  { value: 'angry', label: '😠 生气' },
  { value: 'grateful', label: '🥰 感恩' },
  { value: 'anxious', label: '😰 焦虑' }
];

// 鱼的对话内容
const FISH_DIALOGUES = {
  1: {
    morning: ['早安呀！今天也要开心哦~', '早上好！要吃早餐吗？', '新的一天开始啦！'],
    noon: ['午饭时间到！', '吃饱饱才有力气~', '要午休一下吗？'],
    afternoon: ['下午好！今天过得怎么样？', '来聊聊吧！', '我好想你呀~'],
    evening: ['晚上好！欢迎回家！', '累了吗？休息一下~', '今天辛苦啦！'],
    night: ['还没睡呀？', '晚安哦，做个好梦~', '熬夜对身体不好呢'],
    eating: ['好吃的！', '谢谢投喂~', ' yummy!', '我还要！']
  },
  2: {
    morning: ['早呀，记得喝水哦', '早安，今天也要加油', '新的一天，祝你顺利'],
    noon: ['该吃饭啦，别饿着', '休息一下眼睛哦', '午安，放松一下'],
    afternoon: ['下午好，工作累了吗？', '要不要休息一下？', '我在这儿陪着你'],
    evening: ['欢迎回家，今天过得好吗？', '晚饭吃了吗？', '放松一下吧'],
    night: ['早点休息哦', '晚安，明天见', '好梦~'],
    eating: ['谢谢你~', '好好吃', '好满足', '感恩']
  },
  3: {
    morning: ['...早', '早安，别打扰我', '又是新的一天'],
    noon: ['午饭', '哦', '嗯'],
    afternoon: ['下午', '还行', '随便'],
    evening: ['回来了', '嗯，知道了', '...欢迎'],
    night: ['还不睡？', '晚安', '去吧'],
    eating: ['还行', '可以', '...谢了', '哼']
  },
  4: {
    morning: ['晨光微熹，早安', '朝露未晞，一日之始', '早安，愿君安好'],
    noon: ['正午阳光，温暖如斯', '午时，万物生长', '午餐可曾用过？'],
    afternoon: ['午后慵懒，时光静好', '日影西斜，思君如旧', '下午茶时光'],
    evening: ['暮色四合，欢迎归来', '黄昏时刻，最宜谈心', '今日可有所得？'],
    night: ['夜深人静，月色如水', '繁星点点，愿君好眠', '夜深了，早些休息'],
    eating: ['美味佳肴', '食髓知味', '多谢款待', '心旷神怡']
  }
};
