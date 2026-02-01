// 16가지 Style Identity Type (SIT) 유형 정의
// 4축: I/E(표현), W/C(온도), S/N(변화), M/B(디테일)

export const SIT_TYPES = {
  // I (내향) 유형들
  IWSM: {
    code: "IWSM",
    nickname: "고요한 숲",
    keywords: ["편안함", "자연스러움", "미니멀"],
    style: "미니멀 캐주얼",
    description: "자신만의 편안한 세계에서 자연스러운 아름다움을 추구합니다. 과시보다 자기만족을 중시하며, 깔끔하고 절제된 스타일을 선호합니다."
  },
  IWSB: {
    code: "IWSB",
    nickname: "아늑한 서재",
    keywords: ["포근함", "개성", "빈티지"],
    style: "빈티지 캐주얼",
    description: "따뜻하고 포근한 분위기 속에서 자신만의 개성을 표현합니다. 검증된 아이템에 작은 포인트를 더해 나만의 스타일을 완성합니다."
  },
  IWNM: {
    code: "IWNM",
    nickname: "젠 마스터",
    keywords: ["절제", "탐구", "노멀코어"],
    style: "노멀코어",
    description: "내면의 평화를 추구하며 새로운 스타일을 조용히 탐구합니다. 최소한의 요소로 최대의 효과를 내는 것을 즐깁니다."
  },
  IWNB: {
    code: "IWNB",
    nickname: "숨은 예술가",
    keywords: ["창의", "실험", "아방가르드"],
    style: "아방가르드 캐주얼",
    description: "남들의 시선보다 자신의 예술적 감각을 따릅니다. 대담한 실험을 두려워하지 않지만, 그것을 과시하지는 않습니다."
  },
  ICSM: {
    code: "ICSM",
    nickname: "차분한 그림자",
    keywords: ["절제", "세련", "다크"],
    style: "다크 미니멀",
    description: "어둡고 세련된 톤으로 조용한 존재감을 드러냅니다. 미니멀하지만 강렬한 인상을 남기는 것을 선호합니다."
  },
  ICSB: {
    code: "ICSB",
    nickname: "비밀의 정원",
    keywords: ["개성", "정교함", "고딕"],
    style: "고딕 로맨틱",
    description: "차가운 외면 속에 정교한 디테일의 세계를 숨기고 있습니다. 자신만의 비밀스러운 스타일 세계를 구축합니다."
  },
  ICNM: {
    code: "ICNM",
    nickname: "미래에서 온",
    keywords: ["혁신", "간결", "테크"],
    style: "테크웨어",
    description: "미래지향적이고 혁신적인 스타일을 추구합니다. 기능성과 미니멀한 디자인의 완벽한 조화를 찾습니다."
  },
  ICNB: {
    code: "ICNB",
    nickname: "밤의 예술가",
    keywords: ["실험", "강렬", "스트리트"],
    style: "스트리트 아방가르드",
    description: "차갑고 대담한 실험을 즐기는 밤의 아티스트입니다. 강렬한 스타일로 자신만의 세계를 표현합니다."
  },
  
  // E (외향) 유형들
  EWSM: {
    code: "EWSM",
    nickname: "햇살의 미소",
    keywords: ["친근", "깔끔", "프레피"],
    style: "프레피 캐주얼",
    description: "따뜻하고 친근한 인상으로 사람들에게 호감을 줍니다. 깔끔하고 단정한 스타일로 신뢰감을 형성합니다."
  },
  EWSB: {
    code: "EWSB",
    nickname: "봄날의 정원사",
    keywords: ["화사", "낭만", "로맨틱"],
    style: "로맨틱 캐주얼",
    description: "화사하고 낭만적인 분위기를 자아냅니다. 포인트 아이템으로 자신의 개성을 밝게 표현하는 것을 즐깁니다."
  },
  EWNM: {
    code: "EWNM",
    nickname: "트렌드 서퍼",
    keywords: ["최신", "편안", "컨템포러리"],
    style: "컨템포러리 캐주얼",
    description: "트렌드를 자연스럽게 자신의 것으로 소화합니다. 새로운 것을 받아들이면서도 편안함을 잃지 않습니다."
  },
  EWNB: {
    code: "EWNB",
    nickname: "무대 위의 꽃",
    keywords: ["화려", "표현", "맥시멀"],
    style: "맥시멀리즘",
    description: "모든 시선을 끌어당기는 화려한 스타일의 소유자입니다. 대담한 색상과 패턴으로 자신을 표현합니다."
  },
  ECSM: {
    code: "ECSM",
    nickname: "도시의 건축가",
    keywords: ["세련", "모던", "미니멀"],
    style: "모던 미니멀",
    description: "도시적이고 세련된 이미지를 추구합니다. 깔끔한 라인과 절제된 컬러로 프로페셔널한 인상을 만듭니다."
  },
  ECSB: {
    code: "ECSB",
    nickname: "밤의 사교가",
    keywords: ["우아", "강렬", "글램"],
    style: "글램 시크",
    description: "우아하면서도 강렬한 존재감을 발산합니다. 세련된 디테일로 파티의 중심에 서는 것을 즐깁니다."
  },
  ECNM: {
    code: "ECNM",
    nickname: "런웨이 스카우터",
    keywords: ["트렌디", "날카로움", "하이패션"],
    style: "하이패션 미니멀",
    description: "최신 트렌드를 날카롭게 포착하고 자신의 것으로 만듭니다. 미니멀하지만 앞서가는 스타일을 추구합니다."
  },
  ECNB: {
    code: "ECNB",
    nickname: "스타일 아이콘",
    keywords: ["대담", "선도", "스테이트먼트"],
    style: "스테이트먼트 패션",
    description: "패션의 경계를 넓히는 선구자입니다. 대담한 선택으로 트렌드를 이끌어가며 주목받는 것을 즐깁니다."
  }
} as const;

export type SitTypeCode = keyof typeof SIT_TYPES;
export type SitTypeInfo = typeof SIT_TYPES[SitTypeCode];
