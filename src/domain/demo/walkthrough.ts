/** Клиентский сценарий «Прогнать демо» — без записи в БД. */

export const DEMO_STORY = {
  school: "СШ №1 · Пилотный район",
  donor: "Ирина К.",
  donorRole: "Завхоз",
  freelancer: "Алексей В.",
  freelancerRole: "Фрилансер",
  itemTitle: "Парта ученическая",
  category: "Мебель",
  dealByn: "47,00",
  newPriceByn: "165,00",
  repairByn: "47,00",
  disposalByn: "8,00",
  savingByn: "126,00",
  images: {
    before: "/demo/desk-before.jpg",
    after: "/demo/desk-after.jpg",
    thumb: "/demo/desk-thumb.jpg",
  },
} as const;

export type DemoSceneKind =
  | "form"
  | "listed"
  | "catalog"
  | "claim"
  | "deal"
  | "chat"
  | "timeline"
  | "photos"
  | "act"
  | "district"
  | "outro";

export type DemoChatLine = {
  kind: "system" | "donor" | "freelancer";
  text: string;
};

export type DemoStep = {
  id: string;
  shortLabel: string;
  role: string;
  title: string;
  narration: string;
  screenLabel: string;
  durationMs: number;
  scene: DemoSceneKind;
  chat?: DemoChatLine[];
};

export const DEMO_WALKTHROUGH_STEPS: DemoStep[] = [
  {
    id: "form",
    shortLabel: "Заявка",
    role: DEMO_STORY.donorRole,
    title: "Завхоз заполняет карточку",
    narration: `${DEMO_STORY.donor} из ${DEMO_STORY.school} описывает сломанную парту: категория «${DEMO_STORY.category}», фото «до», ориентир бюджета на ремонт.`,
    screenLabel: "Кабинет · новая карточка",
    durationMs: 7500,
    scene: "form",
  },
  {
    id: "listed",
    shortLabel: "Публикация",
    role: DEMO_STORY.donorRole,
    title: "Вещь появляется в каталоге",
    narration: `Карточка «${DEMO_STORY.itemTitle}» опубликована со статусом LISTED — школа готова отдать в ремонт вместо закупки новой.`,
    screenLabel: "Каталог · опубликованная карточка",
    durationMs: 7200,
    scene: "listed",
  },
  {
    id: "catalog",
    shortLabel: "Биржа",
    role: DEMO_STORY.freelancerRole,
    title: "Фрилансер видит лот на бирже",
    narration: `${DEMO_STORY.freelancer} открывает биржу: парта подходит по навыку «дерево», рядом другие лоты района.`,
    screenLabel: "Биржа · доступные лоты",
    durationMs: 7500,
    scene: "catalog",
  },
  {
    id: "claim",
    shortLabel: "Отклик",
    role: DEMO_STORY.freelancerRole,
    title: "Берёт ремонт в работу",
    narration: "Исполнитель откликается на лот и предлагает стартовую цену — начинается сделка.",
    screenLabel: "Заказ · отклик",
    durationMs: 7000,
    scene: "claim",
  },
  {
    id: "deal",
    shortLabel: "Торг",
    role: "Торг",
    title: "Сделка по цене",
    narration: `Торг в интерфейсе заказа: оффер 45 → контр 50 → сходятся на ${DEMO_STORY.dealByn} BYN. Завхоз принимает цену.`,
    screenLabel: "Заказ · сделка по цене",
    durationMs: 9500,
    scene: "deal",
    chat: [
      { kind: "system", text: "Фрилансер предложил 45,00 BYN" },
      { kind: "freelancer", text: "давай за 50 — с материалом" },
      { kind: "donor", text: "бюджет школы тугой, максимум 47" },
      { kind: "system", text: `Сделка принята · ${DEMO_STORY.dealByn} BYN` },
    ],
  },
  {
    id: "chat",
    shortLabel: "Чат",
    role: "Чат",
    title: "Обсуждение объекта",
    narration: "В чате заказа договариваются о складе, материалах и сроке — как в живом ReSchool.",
    screenLabel: "Заказ · обсуждение объекта",
    durationMs: 12000,
    scene: "chat",
    chat: [
      { kind: "freelancer", text: "Завтра заеду на склад — во сколько удобно?" },
      { kind: "donor", text: "Склад открыт до 16:00, вход со двора" },
      { kind: "freelancer", text: "Нужны саморезы и лак — куплю сам, в цену уже заложил" },
      { kind: "donor", text: "Ок. К пятнице успеете?" },
      { kind: "freelancer", text: "Да. Парта шатается на ножках — укреплю уголками" },
      { kind: "donor", text: "Супер, после ремонта напишите — проверю на месте" },
      { kind: "freelancer", text: "Забрал со склада, начинаю ремонт" },
      { kind: "freelancer", text: "Готово к проверке — можно забирать" },
    ],
  },
  {
    id: "timeline",
    shortLabel: "Ремонт",
    role: DEMO_STORY.freelancerRole,
    title: "Статусы заказа",
    narration: "Заказ идёт по конвейеру: ASSIGNED → IN_PROGRESS → COMPLETED. Школа видит прогресс без звонков.",
    screenLabel: "Заказ · статус ремонта",
    durationMs: 7500,
    scene: "timeline",
  },
  {
    id: "photos",
    shortLabel: "До/после",
    role: "Результат",
    title: "Сравнение до и после",
    narration: "Наглядный результат ремонта: та же парта, но снова пригодная для класса — без закупки новой.",
    screenLabel: "Карточка · фото результата",
    durationMs: 8500,
    scene: "photos",
  },
  {
    id: "act",
    shortLabel: "Акт",
    role: DEMO_STORY.donorRole,
    title: "Завхоз подтверждает",
    narration: "Ирина принимает работу: черновик акта возврата, статус CLOSED, вещь снова в школе.",
    screenLabel: "Кабинет · подтверждение",
    durationMs: 7500,
    scene: "act",
  },
  {
    id: "district",
    shortLabel: "Экономия",
    role: "Район",
    title: "Экономия на дашборде",
    narration: `Вместо новой парты за ${DEMO_STORY.newPriceByn} BYN — ремонт ${DEMO_STORY.repairByn} + избегнутая утилизация. Район видит факт экономии.`,
    screenLabel: "Район · факт экономии",
    durationMs: 9000,
    scene: "district",
  },
  {
    id: "outro",
    shortLabel: "Финал",
    role: "ReSchool",
    title: "Можно войти и повторить вручную",
    narration:
      "Это был наглядный прогон без записи в базу. Выберите роль ниже на экране входа — и пройдите тот же путь на реальных данных.",
    screenLabel: "Демо завершено",
    durationMs: 8000,
    scene: "outro",
  },
];
