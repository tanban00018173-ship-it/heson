import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TW_DATA = {
  '台北市': { '中正區': '100', '大同區': '103', '中山區': '104', '松山區': '105', '大安區': '106', '萬華區': '108', '信義區': '110', '士林區': '111', '北投區': '112', '內湖區': '114', '南港區': '115', '文山區': '116' },
  '新北市': { '板橋區': '220', '三重區': '241', '中和區': '235', '永和區': '234', '新莊區': '242', '新店區': '231', '樹林區': '238', '鶯歌區': '239', '三峽區': '237', '淡水區': '251', '汐止區': '221', '瑞芳區': '224', '土城區': '236', '蘆洲區': '247', '五股區': '248', '泰山區': '243', '林口區': '244', '深坑區': '222', '石碇區': '223', '坪林區': '232', '三芝區': '252', '石門區': '253', '八里區': '249', '平溪區': '226', '雙溪區': '227', '貢寮區': '228', '金山區': '208', '萬里區': '207', '烏來區': '233' },
  '桃園市': { '桃園區': '330', '中壢區': '320', '大溪區': '335', '楊梅區': '326', '蘆竹區': '338', '大園區': '337', '龜山區': '333', '八德區': '334', '龍潭區': '325', '平鎮區': '324', '新屋區': '327', '觀音區': '328', '復興區': '336' },
  '台中市': { '中區': '400', '東區': '401', '南區': '402', '西區': '403', '北區': '404', '北屯區': '406', '西屯區': '407', '南屯區': '408', '太平區': '411', '大里區': '412', '霧峰區': '413', '烏日區': '414', '豐原區': '420', '后里區': '421', '石岡區': '422', '東勢區': '423', '和平區': '424', '新社區': '426', '潭子區': '427', '大雅區': '428', '神岡區': '429', '大肚區': '432', '沙鹿區': '433', '龍井區': '434', '梧棲區': '435', '清水區': '436', '大甲區': '437', '外埔區': '438', '大安區': '439' },
  '基隆市': { '仁愛區': '200', '信義區': '201', '中正區': '202', '中山區': '203', '安樂區': '204', '暖暖區': '205', '七堵區': '206' },
  '新竹市': { '東區': '300', '北區': '302', '香山區': '304' },
  '新竹縣': { '竹北市': '302', '竹東鎮': '310', '新埔鎮': '305', '關西鎮': '306', '湖口鄉': '303', '新豐鄉': '304', '芎林鄉': '307', '橫山鄉': '312', '北埔鄉': '314', '寶山鄉': '308', '峨眉鄉': '315', '尖石鄉': '313', '五峰鄉': '311' },
  '苗栗縣': { '苗栗市': '360', '頭份市': '351', '竹南鎮': '350', '後龍鎮': '356', '通霄鎮': '357', '苑裡鎮': '358', '卓蘭鎮': '369', '大湖鄉': '364', '公館鄉': '363', '銅鑼鄉': '366', '三義鄉': '367', '西湖鄉': '368', '造橋鄉': '361', '頭屋鄉': '362', '三灣鄉': '352', '南庄鄉': '353', '獅潭鄉': '354', '泰安鄉': '365' },
  '彰化縣': { '彰化市': '500', '鹿港鎮': '505', '和美鎮': '508', '線西鄉': '507', '伸港鄉': '509', '福興鄉': '506', '秀水鄉': '504', '花壇鄉': '503', '芬園鄉': '502', '員林市': '510', '溪湖鎮': '514', '田中鎮': '520', '大村鄉': '515', '埔鹽鄉': '516', '埔心鄉': '513', '永靖鄉': '512', '社頭鄉': '511', '二水鄉': '530', '北斗鎮': '521', '二林鎮': '526', '田尾鄉': '522', '埤頭鄉': '523', '芳苑鄉': '528', '大城鄉': '527', '竹塘鄉': '525', '溪州鄉': '524' },
  '南投縣': { '南投市': '540', '埔里鎮': '545', '草屯鎮': '542', '竹山鎮': '557', '集集鎮': '552', '名間鄉': '551', '鹿谷鄉': '558', '中寮鄉': '541', '魚池鄉': '555', '國姓鄉': '544', '水里鄉': '553', '信義鄉': '556', '仁愛鄉': '546' },
  '雲林縣': { '斗六市': '640', '斗南鎮': '630', '虎尾鎮': '632', '西螺鎮': '648', '土庫鎮': '633', '北港鎮': '651', '古坑鄉': '646', '大埤鄉': '631', '莿桐鄉': '647', '林內鄉': '643', '二崙鄉': '649', '崙背鄉': '650', '麥寮鄉': '638', '東勢鄉': '635', '褒忠鄉': '634', '台西鄉': '636', '元長鄉': '655', '四湖鄉': '654', '口湖鄉': '653', '水林鄉': '652' },
  '嘉義市': { '東區': '600', '西區': '600' },
  '嘉義縣': { '太保市': '612', '朴子市': '613', '布袋鎮': '625', '大林鎮': '622', '民雄鄉': '621', '溪口鄉': '623', '新港鄉': '616', '六腳鄉': '615', '東石鄉': '614', '義竹鄉': '624', '鹿草鄉': '611', '水上鄉': '608', '中埔鄉': '606', '竹崎鄉': '604', '梅山鄉': '603', '番路鄉': '602', '大埔鄉': '607', '阿里山鄉': '605' },
  '台南市': { '中西區': '700', '東區': '701', '南區': '702', '北區': '704', '安平區': '708', '安南區': '709', '永康區': '710', '歸仁區': '711', '新化區': '712', '左鎮區': '713', '玉井區': '714', '楠西區': '715', '南化區': '716', '仁德區': '717', '關廟區': '718', '龍崎區': '719', '官田區': '720', '麻豆區': '721', '佳里區': '722', '西港區': '723', '七股區': '724', '將軍區': '725', '學甲區': '726', '北門區': '727', '新營區': '730', '後壁區': '731', '白河區': '732', '東山區': '733', '六甲區': '734', '下營區': '735', '柳營區': '736', '鹽水區': '737', '善化區': '741', '大內區': '742', '山上區': '743', '新市區': '744', '安定區': '745' },
  '高雄市': { '新興區': '800', '前金區': '801', '苓雅區': '802', '鹽埕區': '803', '鼓山區': '804', '旗津區': '805', '前鎮區': '806', '三民區': '807', '楠梓區': '811', '小港區': '812', '左營區': '813', '仁武區': '814', '大社區': '815', '岡山區': '820', '路竹區': '821', '阿蓮區': '822', '田寮區': '823', '燕巢區': '824', '橋頭區': '825', '梓官區': '826', '彌陀區': '827', '永安區': '828', '湖內區': '829', '鳳山區': '830', '大寮區': '831', '林園區': '832', '鳥松區': '833', '大樹區': '840', '旗山區': '842', '美濃區': '843', '六龜區': '844', '內門區': '845', '杉林區': '846', '甲仙區': '847', '桃源區': '848', '那瑪夏區': '849', '茂林區': '851', '茄萣區': '852' },
  '屏東縣': { '屏東市': '900', '潮州鎮': '920', '東港鎮': '928', '恆春鎮': '946', '萬丹鄉': '913', '長治鄉': '908', '麟洛鄉': '909', '九如鄉': '904', '里港鄉': '905', '鹽埔鄉': '907', '高樹鄉': '906', '萬巒鄉': '923', '內埔鄉': '912', '竹田鄉': '911', '新埤鄉': '925', '枋寮鄉': '940', '新園鄉': '932', '崁頂鄉': '924', '林邊鄉': '927', '南州鄉': '926', '佳冬鄉': '931', '琉球鄉': '929', '車城鄉': '944', '滿州鄉': '947', '枋山鄉': '941', '三地門鄉': '901', '霧台鄉': '902', '瑪家鄉': '903', '泰武鄉': '921', '來義鄉': '922', '春日鄉': '942', '獅子鄉': '943', '牡丹鄉': '945', '吾拉魯滋部落': '903' },
  '宜蘭縣': { '宜蘭市': '260', '羅東鎮': '265', '蘇澳鎮': '270', '頭城鎮': '261', '礁溪鄉': '262', '壯圍鄉': '263', '員山鄉': '264', '冬山鄉': '269', '五結鄉': '268', '三星鄉': '266', '大同鄉': '267', '南澳鄉': '272' },
  '花蓮縣': { '花蓮市': '970', '鳳林鎮': '975', '玉里鎮': '981', '新城鄉': '971', '吉安鄉': '973', '壽豐鄉': '974', '光復鄉': '976', '豐濱鄉': '977', '瑞穗鄉': '978', '富里鄉': '983', '秀林鄉': '972', '萬榮鄉': '979', '卓溪鄉': '982' },
  '台東縣': { '台東市': '950', '成功鎮': '961', '關山鎮': '956', '卑南鄉': '954', '鹿野鄉': '955', '池上鄉': '958', '東河鄉': '959', '長濱鄉': '962', '太麻里鄉': '963', '大武鄉': '965', '綠島鄉': '951', '海端鄉': '957', '延平鄉': '957', '金峰鄉': '964', '達仁鄉': '966', '蘭嶼鄉': '952' },
  '澎湖縣': { '馬公市': '880', '湖西鄉': '885', '白沙鄉': '884', '西嶼鄉': '881', '望安鄉': '882', '七美鄉': '883' },
  '金門縣': { '金城鎮': '893', '金湖鎮': '891', '金沙鎮': '890', '金寧鄉': '892', '烈嶼鄉': '894', '烏坵鄉': '896' },
  '連江縣': { '南竿鄉': '209', '北竿鄉': '210', '莒光鄉': '211', '東引鄉': '212' },
};

export { TW_DATA };

// 常用字筆畫數對照（用於排序首字）
const STROKE_ORDER = {
  '一':1,'二':2,'三':3,'七':2,'八':2,'九':2,'十':2,'大':3,'小':3,'山':3,'上':3,'中':4,'五':4,'六':4,'內':4,'今':4,'元':4,'公':4,'分':4,'北':5,'台':5,'四':4,'外':5,'平':5,'玉':5,'左':5,'右':5,'石':5,'竹':6,'安':6,'朴':6,'西':6,'老':6,'光':6,'吉':6,'名':6,'后':6,'全':6,'冬':5,'白':5,'六':4,'古':5,'土':3,'口':3,'三':3,'士':3,'大':3,'小':3,'山':3,'千':3,'卑':8,'卓':8,'八':2,'七':2,'九':2,'十':2,'二':2,'人':2,'力':2,'刀':2,'又':2,'乃':2,'乙':1,'一':1,
  '台':5,'北':5,'南':9,'東':8,'西':6,'中':4,'新':13,'高':10,'屏':9,'宜':8,'花':8,'台':5,'基':11,'桃':10,'苗':8,'彰':14,'雲':12,'嘉':14,'澎':16,'金':8,'連':10,'大':3,'小':3,'永':5,'安':6,'信':9,'士':3,'文':4,'內':4,'松':8,'萬':13,'板':8,'三':3,'中':4,'土':3,'五':4,'林':8,'石':5,'坪':8,'平':5,'深':11,'八':2,'蘆':19,'泰':10,'汐':6,'瑞':13,'淡':11,'鶯':21,'樹':16,'新':13,
  '七':2,'八':2,'九':2,'十':2,'二':2,'三':3,'四':4,'五':4,'六':4,
  // 縣市首字
  '台':5,'新':13,'桃':10,'基':11,'苗':8,'彰':14,'南':9,'高':10,'屏':9,'宜':8,'花':8,'澎':16,'金':8,'連':10,'嘉':14,'雲':12,
  // 行政區常見首字
  '中':4,'大':3,'小':3,'山':3,'士':3,'土':3,'內':4,'五':4,'六':4,'天':4,'太':4,'文':4,'水':4,'牛':4,'仁':4,'元':4,'公':4,'化':4,'友':4,'心':4,'木':4,'比':4,'毛':4,'王':4,'冬':5,'北':5,'左':5,'右':5,'平':5,'永':5,'甲':5,'白':5,'古':5,'外':5,'玉':5,'石':5,'田':5,'四':4,'民':5,'本':5,'弘':5,'出':5,'加':5,'布':5,'弁':5,'矢':5,'打':5,'包':5,'令':5,'可':5,'旦':5,'主':5,'他':5,'代':5,'付':5,'以':5,'仙':5,
  '吉':6,'安':6,'光':6,'竹':6,'西':6,'汐':6,'名':6,'合':6,'后':6,'全':6,'共':6,'各':6,'多':6,'曲':6,'羊':6,'老':6,'地':6,'年':6,'朴':6,'朱':6,'有':6,'百':6,'至':6,'同':6,'在':6,'成':6,'早':6,'色':6,'艮':6,'行':6,'衣':6,'页':6,'交':6,'件':6,'伏':6,'任':6,'伐':6,
  '芎':7,'佳':7,'里':7,'何':7,'坑':7,'社':7,'芳':7,'汪':7,'沙':7,'坐':7,'址':7,'局':7,'材':7,'束':7,'步':7,'沒':7,'狂':7,'沙':7,'系':7,'杜':7,'村':7,'来':7,'克':7,'壯':7,'芬':7,'坪':7,'均':7,'圳':7,'吳':7,'完':7,'妙':7,'呈':7,'宏':7,'尾':7,'忘':7,'戒':7,
  '東':8,'板':8,'林':8,'松':8,'金':8,'長':8,'武':8,'岡':8,'明':8,'和':8,'奇':8,'季':8,'佐':8,'官':8,'定':8,'延':8,'忠':8,'昌':8,'昂':8,'旺':8,'枝':8,'欣':8,'油':8,'河':8,'泡':8,'炎':8,'芸':8,'花':8,'虎':8,'宜':8,'坡':8,'押':8,'抗':8,'招':8,'拒':8,'拔':8,'披':8,'卑':8,'受':8,'命':8,'周':8,
  '信':9,'南':9,'屏':9,'後':9,'美':9,'秋':9,'洗':9,'洲':9,'城':9,'客':9,'恆':9,'柳':9,'段':9,'泉':9,'皇':9,'砂':9,'眉':9,'春':9,'相':9,'紅':9,'界':9,'科':9,'竿':9,'索':9,'查':9,'柏':9,'柑':9,'架':9,'柔':9,'炭':9,'洛':9,'海':9,'泰':10,'烏':10,
  '高':10,'桃':10,'泰':10,'烏':10,'海':10,'桑':10,'徐':10,'拿':10,'振':10,'索':10,'豹':10,'草':10,'起':10,'馬':10,'倒':10,'凌':10,'凍':10,'剛':10,'剩':10,'唐':10,'庭':10,'恩':10,'挑':10,'旁':10,'旅':10,'時':10,'書':10,'核':10,'氣':10,'烤':10,'真':10,'神':10,'秦':10,'茉':10,'茅':10,'茶':10,'討':10,
  '連':10,'深':11,'梅':11,'崇':11,'頂':11,'帶':11,'彪':11,'捲':11,'桶':11,'淡':11,'淺':11,'清':11,'理':11,'球':11,'現':11,'畢':11,'移':11,'笛':11,'細':11,'終':11,'習':11,'荷':11,'蛇':11,'設':11,'責':11,
  '雲':12,'景':12,'晶':12,'棒':12,'棟':12,'湖':12,'無':12,'番':12,'等':12,'策':12,'結':12,'絮':12,'著':12,'裂':12,'超':12,'進':12,'開':12,'間':12,'集':12,'黑':12,'欽':12,'渡':12,
  '嘉':14,'新':13,'瑞':13,'溪':13,'義':13,'葉':13,'道':13,'想':13,'感':13,'搖':13,'源':13,'準':13,'溝':13,'煙':13,'碎':13,'節':13,'義':13,'詩':13,'路':13,'農':13,'頓':13,'鼓':13,
  '彰':14,'嘉':14,'旗':14,'熊':14,'種':14,'算':14,'管':14,'緊':14,'說':14,'語':14,'誤':14,'銀':14,'閣':14,'領':14,'鳳':14,'鼻':14,
  '廣':15,'澎':16,'蘆':19,'鶯':21,'麟':23,
};

function getStrokeCount(char) {
  return STROKE_ORDER[char] ?? 99;
}

function sortByStroke(a, b) {
  return getStrokeCount(a[0]) - getStrokeCount(b[0]);
}

export default function RegionPicker({ open, city: initCity, district: initDistrict, onClose, onConfirm }) {
  const [selectedCity, setSelectedCity] = useState(initCity || '');
  const [selectedDistrict, setSelectedDistrict] = useState(initDistrict || '');
  const [locating, setLocating] = useState(false);

  const cities = Object.keys(TW_DATA);
  const districts = selectedCity ? Object.keys(TW_DATA[selectedCity]) : [];

  // Group districts by first char
  const groupedDistricts = districts.reduce((acc, d) => {
    const key = d[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedDistrict('');
  };

  const handleDistrictSelect = (district) => {
    const postal = TW_DATA[selectedCity]?.[district] || '';
    onConfirm({ city: selectedCity, district, postal_code: postal });
  };

  const handleReset = () => {
    setSelectedCity('');
    setSelectedDistrict('');
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const keyRes = await base44.functions.invoke('getGoogleMapsKey', {});
          const apiKey = keyRes.data?.key || '';
          if (!apiKey) { setLocating(false); return; }
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=zh-TW&key=${apiKey}`
          );
          const data = await res.json();
          const components = data.results?.[0]?.address_components || [];
          const cityComp = components.find(c => c.types.includes('administrative_area_level_1'));
          const distComp = components.find(c => c.types.includes('administrative_area_level_3') || c.types.includes('administrative_area_level_2'));
          const cityName = cityComp?.long_name || '';
          const distName = distComp?.long_name || '';
          const matchedCity = cities.find(c => cityName.includes(c) || c.includes(cityName));
          if (matchedCity) {
            const matchedDist = Object.keys(TW_DATA[matchedCity]).find(d => distName.includes(d) || d.includes(distName));
            if (matchedDist) {
              const postal = TW_DATA[matchedCity][matchedDist];
              setLocating(false);
              onConfirm({ city: matchedCity, district: matchedDist, postal_code: postal });
              return;
            }
            setSelectedCity(matchedCity);
          }
        } catch (e) {
          console.error('GPS error', e);
        }
        setLocating(false);
      },
      (err) => { console.error('Geolocation error', err); setLocating(false); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#f2f2f7] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-stone-900">選擇你的地區</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 已選地區 - 有選縣市才顯示 */}
        {selectedCity && <div className="bg-white px-4 pt-4 pb-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-stone-400">已選地區</span>
            <button onClick={handleReset} className="text-xs text-stone-400 hover:text-stone-600">重設</button>
          </div>
          {/* Timeline */}
          <div className="flex gap-3">
            {/* 左側軸線 */}
            <div className="flex flex-col items-center w-3 flex-shrink-0 mt-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-stone-300 flex-shrink-0" />
              <div className="w-0.5 flex-1 min-h-[20px] bg-stone-200 my-1" />
              <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${selectedDistrict ? 'border-red-500 bg-red-500' : 'border-red-400'}`} />
            </div>
            {/* 右側文字 */}
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-sm text-stone-800 font-medium py-0.5">{selectedCity}</span>
              <div className={`flex items-center px-3 py-2 rounded-xl border ${!selectedCity ? 'border-stone-200 bg-stone-50' : 'border-red-100 bg-red-50'}`}>
                <span className={`text-sm font-medium ${selectedDistrict ? 'text-red-600' : 'text-red-500'}`}>
                  {selectedDistrict || '選擇行政區'}
                </span>
              </div>
            </div>
          </div>
        </div>}

        {/* GPS button - 未選縣市才顯示 */}
        {!selectedCity && <div className="bg-white mb-2 px-4 py-3">
          <button
            onClick={handleGPS}
            disabled={locating}
            className="w-full flex items-center justify-center gap-3 py-2 hover:bg-stone-50 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-stone-700" />
            </div>
            <span className="text-sm font-medium text-stone-800">
              {locating ? '定位中...' : '使用我的當前位置'}
            </span>
          </button>
        </div>}

        {/* City list */}
        {!selectedCity && (
          <div className="bg-white">
            <p className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">縣市</p>
            {Object.entries(
              cities.reduce((acc, city) => {
                const key = city[0];
                if (!acc[key]) acc[key] = [];
                acc[key].push(city);
                return acc;
              }, {})
            ).sort(([a], [b]) => getStrokeCount(a) - getStrokeCount(b)).map(([initial, group]) =>
              group.map((city, i) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="w-full flex items-center px-4 py-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                >
                  <span className="w-8 text-sm text-stone-300 flex-shrink-0">{i === 0 ? initial : ''}</span>
                  <span className="text-sm text-stone-800">{city}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* District list */}
        {selectedCity && (
          <div className="bg-white">
            <p className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider bg-[#f2f2f7]">行政區</p>
            {Object.entries(groupedDistricts).sort(([a], [b]) => getStrokeCount(a) - getStrokeCount(b)).map(([initial, dists]) => (
              dists.map((dist, i) => (
                <button
                  key={dist}
                  onClick={() => handleDistrictSelect(dist)}
                  className="w-full flex items-center px-4 py-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors"
                >
                  <span className="w-8 text-sm text-stone-300 flex-shrink-0">{i === 0 ? initial : ''}</span>
                  <span className="text-sm text-stone-800">{dist}</span>
                </button>
              ))
            ))}
          </div>
        )}
      </div>
    </div>
  );
}