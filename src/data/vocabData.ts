export interface VocabItem {
  word: string;
  meaning: string;
  hanja: string;
  subject: '국어' | '수학' | '사회' | '과학';
  example: string;
}

export const VOCAB_DATA: VocabItem[] = [
  // --- 국어 ---
  { word: "촉구", meaning: "어떤 일을 빨리 하도록 재촉함", hanja: "促求", subject: "국어", example: "시민들이 대책 마련을 강력히 촉구했다." },
  { word: "사기", meaning: "남을 속임 / 의욕이나 기세", hanja: "詐欺 / 士氣", subject: "국어", example: "우리 반 축구 대표팀의 사기가 하늘을 찌른다." },
  { word: "일화", meaning: "세상에 널리 알려지지 않은 짧고 흥미로운 이야기", hanja: "軼話", subject: "국어", example: "위인의 어린 시절 일화를 읽으며 감동을 받았다." },
  { word: "대가", meaning: "어떤 일에 들인 노력의 보수 / 뛰어난 전문가", hanja: "代價 / 大家", subject: "국어", example: "성공 뒤에는 땀방울이라는 대가가 따른다." },
  { word: "안목", meaning: "사물을 분별하고 가치를 판단하는 높은 식견", hanja: "眼目", subject: "국어", example: "선생님은 좋은 책을 고르는 안목이 뛰어나시다." },
  { word: "체면", meaning: "남을 대하기에 떳떳한 도리나 얼굴", hanja: "體面", subject: "국어", example: "친구들 앞에서 거짓말을 해 체면을 구겼다." },
  { word: "견문", meaning: "보고 들음으로써 넓어진 지식과 경험", hanja: "見聞", subject: "국어", example: "현장체험학습을 통해 넓은 견문을 쌓았다." },
  { word: "대립", meaning: "서로 다른 의견이나 입장이 맞서 버팀", hanja: "對立", subject: "국어", example: "토론에서 찬성과 반대의 입장이 팽팽히 대립했다." },
  { word: "단결", meaning: "뜻을 같이하여 하나로 굳게 뭉침", hanja: "團結", subject: "국어", example: "학급 회의에서 서로 단결하여 문제를 해결했다." },
  { word: "배포", meaning: "널리 베풀어 여러 사람에게 나누어 줌", hanja: "配布", subject: "국어", example: "체험 학습 안내장을 전교생에게 배포했다." },
  { word: "조직", meaning: "일정한 목적을 달성하기 위해 짜인 체계적인 집단", hanja: "組織", subject: "국어", example: "동아리 활동을 위해 새로운 학생 자치 조직을 만들었다." },
  { word: "자립", meaning: "남에게 의존하지 않고 스스로 힘으로 섬", hanja: "自立", subject: "국어", example: "어린 시절부터 스스로 계획을 세우는 자립심을 길렀다." },
  { word: "규제", meaning: "규칙이나 법률을 정하여 제한함", hanja: "規制", subject: "국어", example: "학교 앞 스쿨존에서는 속도를 엄격하게 규제한다." },
  { word: "협약", meaning: "여러 사람이나 단체가 함께 맺은 약속", hanja: "協約", subject: "국어", example: "두 나라는 환경 보호를 위한 협약을 체결했다." },
  { word: "여론", meaning: "사회 여러 사람의 공통되고 지배적인 의견", hanja: "輿論", subject: "국어", example: "급식 개선을 원하는 학생들의 여론이 모아졌다." },
  { word: "비유", meaning: "어떤 현상이나 사물을 비슷한 다른 것에 빗대어 표현함", hanja: "比喩", subject: "국어", example: "시간을 흐르는 강물에 비유하여 시를 썼다." },
  { word: "은유", meaning: "‘~처럼’ 없이 암시적으로 대상에 빗대어 나타내는 표현", hanja: "隱喩", subject: "국어", example: "'내 마음은 호수요'는 대표적인 은유법이다." },
  { word: "직유", meaning: "‘~같이’, ‘~처럼’을 써서 직접 빗대는 비유법", hanja: "直喩", subject: "국어", example: "'사과처럼 붉은 뺨'은 직유법에 해당한다." },
  { word: "운율", meaning: "시나 노랫말에서 말의 소리가 일정한 규칙으로 반복되는 리듬", hanja: "韻律", subject: "국어", example: "동시를 소리 내어 읽으면 아름다운 운율이 느껴진다." },
  { word: "공약", meaning: "공적인 자리에서 대중에게 반드시 지키겠다고 약속함", hanja: "公約", subject: "국어", example: "전교 회장 후보가 다양한 학생 복지 공약을 발표했다." },
  { word: "요약", meaning: "긴 글이나 말의 중요한 핵심 내용만 간추림", hanja: "要略", subject: "국어", example: "읽은 책의 줄거리를 세 문장으로 요약했다." },
  { word: "문맥", meaning: "글이나 문장에서 앞뒤 구절이 서로 이어지는 관계나 흐름", hanja: "文脈", subject: "국어", example: "모르는 단어의 뜻을 문맥을 통해 짐작해 보았다." },
  { word: "관용", meaning: "둘 이상의 낱말이 합쳐져 본래와 다른 특별한 의미를 나타냄", hanja: "慣用", subject: "국어", example: "'발이 넓다'는 아는 사람이 많다는 뜻의 관용 표현이다." },

  // --- 수학 ---
  { word: "계산", meaning: "수를 세거나 사칙연산(더하기·빼기·곱하기·나누기)의 셈을 함", hanja: "計算", subject: "수학", example: "식을 차례대로 정리하여 정확하게 계산했다." },
  { word: "분모", meaning: "분수에서 분수선 아래에 위치한 기준이 되는 수", hanja: "分母", subject: "수학", example: "분모가 다른 분수는 먼저 통분을 해야 한다." },
  { word: "분자", meaning: "분수에서 분수선 위에 위치하여 덜어낸 몫을 나타내는 수", hanja: "分子", subject: "수학", example: "분자가 분모보다 큰 분수를 가분수라고 부른다." },
  { word: "수직선", meaning: "수를 일정한 간격의 눈금으로 나타낸 직선", hanja: "數直線", subject: "수학", example: "수직선 위에 소수의 위치를 점으로 표시했다." },
  { word: "전항", meaning: "비(A:B)에서 기호(:)의 앞쪽에 있는 항", hanja: "前項", subject: "수학", example: "비 3:5에서 전항은 3이다." },
  { word: "후항", meaning: "비(A:B)에서 기호(:)의 뒤쪽에 있는 항", hanja: "後項", subject: "수학", example: "비 3:5에서 후항은 5이다." },
  { word: "관찰", meaning: "사물이나 현상의 특징을 주의 깊게 자세히 살펴봄", hanja: "觀察", subject: "수학", example: "입체도형의 모서리와 꼭짓점을 유심히 관찰했다." },
  { word: "기록", meaning: "측정한 값이나 사실, 생각을 표나 글로 남김", hanja: "記錄", subject: "수학", example: "매시간 측정한 온도를 표에 정확히 기록했다." },
  { word: "분수", meaning: "전체를 똑같이 나눈 것 중의 몇 개를 나타낸 수", hanja: "分數", subject: "수학", example: "피자 한 판을 8조각으로 나눈 것 중 3조각은 3/8이다." },
  { word: "등분", meaning: "수나 양, 길이를 서로 같은 크기로 똑같이 나눔", hanja: "等分", subject: "수학", example: "색종이를 가로세로로 4등분하여 잘랐다." },
  { word: "비율", meaning: "기준량에 대한 비교하는 양의 크기를 분수나 소수로 나타낸 값", hanja: "比率", subject: "수학", example: "타석 수에 대한 안타 수의 비율을 타율이라 한다." },
  { word: "백분율", meaning: "기준량을 100으로 보았을 때의 비율(기호 %)", hanja: "百分率", subject: "수학", example: "할인율 20%는 백분율로 나타낸 값이다." },
  { word: "합동", meaning: "모양과 크기가 똑같아서 완전히 포개어지는 두 도형", hanja: "合同", subject: "수학", example: "두 삼각형은 세 변의 길이가 같아 서로 합동이다." },
  { word: "수직", meaning: "두 직선이 만나서 이루는 각이 직각(90도)인 상태", hanja: "垂直", subject: "수학", example: "벽과 바닥은 서로 수직을 이루고 있다." },
  { word: "평행", meaning: "한 평면 위에서 두 직선이 아무리 늘려도 만나지 않는 상태", hanja: "平行", subject: "수학", example: "기찻길의 두 선로는 서로 평행하다." },
  { word: "원주율", meaning: "원의 지름에 대한 원의 둘레(원주)의 비율 (약 3.14)", hanja: "圓周率", subject: "수학", example: "원주율을 이용해 원의 넓이를 구했다." },
  { word: "비례식", meaning: "비율이 같은 두 비를 등호(=)를 써서 나타낸 식", hanja: "比例式", subject: "수학", example: "2:3 = 4:6과 같은 형태를 비례식이라 한다." },

  // --- 사회 ---
  { word: "헌법", meaning: "국가의 기본 원칙과 국민의 기본권 및 통치 구조를 정한 최고의 법", hanja: "憲法", subject: "사회", example: "모든 법률은 헌법의 정신에 어긋나서는 안 된다." },
  { word: "혁명", meaning: "기존의 사회 질서나 정치 체제를 근본적으로 급격하게 바꿈", hanja: "革命", subject: "사회", example: "4·19 혁명은 민주주의를 지키기 위한 시민들의 외침이었다." },
  { word: "독재", meaning: "한 사람이나 소수 집단이 국가 권력을 독점하여 마음대로 휘두름", hanja: "獨裁", subject: "사회", example: "국민들은 독재 정치에 맞서 자유를 쟁취했다." },
  { word: "시위", meaning: "많은 사람이 모여 자신의 주장이나 뜻을 널리 알리는 행동", hanja: "示威", subject: "사회", example: "시민들이 거리에서 평화적인 촛불 시위를 벌였다." },
  { word: "언론", meaning: "신문, 방송, 인터넷 등을 통해 사회의 사실과 의견을 대중에게 전함", hanja: "言論", subject: "사회", example: "민주 사회에서는 자유롭고 공정한 언론이 필수적이다." },
  { word: "정치", meaning: "사회 구성원 간의 이해관계를 조정하고 공동의 규칙을 만드는 활동", hanja: "政治", subject: "사회", example: "국회에서는 국민을 위한 법률을 만드는 정치가 이루어진다." },
  { word: "민주주의", meaning: "국가의 주권이 국민에게 있고 국민을 위해 정치가 이루어지는 제도", hanja: "民主主義", subject: "사회", example: "우리나라는 자유 민주주의 국가이다." },
  { word: "자유", meaning: "외부의 부당한 간섭이나 억압 없이 자신의 뜻대로 행동할 수 있는 권리", hanja: "自由", subject: "사회", example: "타인의 권리를 침해하지 않는 범위 내에서 자유를 누려야 한다." },
  { word: "대륙", meaning: "지구 표면의 바다로 둘러싸인 넓고 거대한 땅덩어리", hanja: "大陸", subject: "사회", example: "아시아 대륙은 세계에서 가장 넓은 면적을 차지한다." },
  { word: "대양", meaning: "지구상의 거대하고 넓은 바다 (태평양, 대서양, 인도양 등)", hanja: "大洋", subject: "사회", example: "태평양은 지구상에서 가장 큰 대양이다." },
  { word: "위도", meaning: "적도를 기준으로 지구상 위치를 남북으로 나타낸 가로선 각도", hanja: "緯度", subject: "사회", example: "적도는 위도 0도이며 고위도로 갈수록 추워진다." },
  { word: "경도", meaning: "본초 자오선을 기준으로 동서 위치를 나타낸 세로선 각도", hanja: "經度", subject: "사회", example: "경도 차이에 따라 각 나라의 표준시가 달라진다." },
  { word: "기후", meaning: "어느 한 지역에서 수십 년간 지속되는 평균적인 날씨 상태", hanja: "氣候", subject: "사회", example: "열대 기후 지역은 일 년 내내 덥고 비가 많이 온다." },
  { word: "삼권분립", meaning: "국가 권력을 입법·사법·행정의 셋으로 나누어 서로 견제하게 함", hanja: "三權分立", subject: "사회", example: "권력의 독점을 막기 위해 헌법은 삼권분립을 규정한다." },

  // --- 과학 ---
  { word: "연소", meaning: "물질이 산소와 결합하여 빛과 열을 내며 타는 현상", hanja: "燃燒", subject: "과학", example: "초가 타오르는 현상은 대표적인 연소 반응이다." },
  { word: "소화", meaning: "불을 끄거나 / 음식물을 잘게 부수어 몸에 흡수되도록 함", hanja: "消火 / 消化", subject: "과학", example: "화재가 발생하면 신속하게 소화기를 사용해야 한다." },
  { word: "산화", meaning: "어떤 물질이 산소와 결합하는 화학적 변화", hanja: "酸化", subject: "과학", example: "공기 중의 산소와 만나 쇠가 붉게 녹스는 것은 산화이다." },
  { word: "광합성", meaning: "식물이 햇빛과 이산화 탄소, 물을 이용해 양분과 산소를 만듦", hanja: "光合成", subject: "과학", example: "식물의 잎에서 광합성이 활발하게 일어난다." },
  { word: "생태계", meaning: "어떤 지역의 모든 생물과 그들을 둘러싼 환경이 이루는 체계", hanja: "生態系", subject: "과학", example: "환경오염은 지구 생태계의 균형을 무너뜨린다." }
];
