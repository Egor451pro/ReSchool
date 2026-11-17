"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DEMO_STORY,
  DEMO_WALKTHROUGH_STEPS,
  type DemoChatLine,
  type DemoStep,
} from "@/domain/demo/walkthrough";

function DemoImg({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static demo assets in /public/demo
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  );
}

function ChatBubble({ line, mine }: { line: DemoChatLine; mine?: boolean }) {
  if (line.kind === "system") {
    return (
      <div className="mx-auto max-w-[95%] rounded-xl bg-muted/70 px-3 py-1.5 text-center text-xs leading-5 text-leaf">
        {line.text}
      </div>
    );
  }
  const isDonor = line.kind === "donor";
  const alignMine = mine ?? isDonor;
  return (
    <div
      className={`flex max-w-[90%] flex-col gap-0.5 rounded-2xl px-3 py-2 text-sm ${
        alignMine ? "panel-accent ml-auto" : "mr-auto bg-muted text-ink ring-1 ring-line"
      }`}
    >
      <span
        className={`text-[10px] font-medium ${
          alignMine ? "panel-accent-muted" : "text-leaf"
        }`}
      >
        {isDonor ? DEMO_STORY.donor : DEMO_STORY.freelancer}
      </span>
      <p className="leading-5">{line.text}</p>
    </div>
  );
}

function StaggerChat({
  lines,
  active,
  asDonorView = true,
}: {
  lines: DemoChatLine[];
  active: boolean;
  asDonorView?: boolean;
}) {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (!active) {
      setVisible(lines.length);
      return;
    }
    setVisible(1);
    if (lines.length <= 1) return;
    let i = 1;
    const id = window.setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= lines.length) window.clearInterval(id);
    }, 550);
    return () => window.clearInterval(id);
  }, [active, lines]);

  return (
    <div className="flex max-h-[14rem] flex-col gap-2 overflow-y-auto sm:max-h-[16rem]">
      {lines.slice(0, visible).map((line, index) => (
        <ChatBubble
          key={`${line.kind}-${index}-${line.text.slice(0, 12)}`}
          line={line}
          mine={asDonorView ? line.kind === "donor" : line.kind === "freelancer"}
        />
      ))}
    </div>
  );
}

function SceneShell({
  screenLabel,
  role,
  children,
}: {
  screenLabel: string;
  role: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-1 flex min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-line bg-paper/85 shadow-[var(--shadow-soft)] sm:min-h-[17rem]">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2.5">
        <span className="min-w-0 truncate text-xs font-medium text-leaf">{screenLabel}</span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
          {role}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">{children}</div>
    </div>
  );
}

function DemoScene({ step, active }: { step: DemoStep; active: boolean }) {
  switch (step.scene) {
    case "form":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="grid gap-3 sm:grid-cols-[7.5rem_1fr]">
            <DemoImg
              src={DEMO_STORY.images.before}
              alt="Парта до ремонта"
              className="h-28 w-full rounded-xl border border-line sm:h-full"
            />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-ink">{DEMO_STORY.itemTitle}</p>
              <p className="text-xs text-leaf">{DEMO_STORY.school}</p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-lg bg-muted px-2 py-1 text-ink">{DEMO_STORY.category}</span>
                <span className="rounded-lg bg-muted px-2 py-1 text-ink">Кол-во: 1</span>
                <span className="rounded-lg bg-muted px-2 py-1 text-ink">Бюджет ~50 BYN</span>
              </div>
              <p className="text-xs leading-5 text-leaf">
                Шатается ножка, сколы лака, нужна укрепка и покрытие.
              </p>
              <div className="h-9 rounded-xl bg-mint/85 text-center text-xs font-semibold leading-9 text-on-mint">
                Опубликовать
              </div>
            </div>
          </div>
        </SceneShell>
      );
    case "listed":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <DemoImg
              src={DEMO_STORY.images.before}
              alt="Опубликованная парта"
              className="h-36 w-full sm:h-40"
            />
            <div className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{DEMO_STORY.itemTitle}</p>
                <span className="rounded-full bg-mint/30 px-2 py-0.5 text-[10px] font-semibold text-ink">
                  LISTED
                </span>
              </div>
              <p className="text-xs text-leaf">
                {DEMO_STORY.school} · {DEMO_STORY.category}
              </p>
              <p className="text-xs text-leaf">Автор: {DEMO_STORY.donor}</p>
            </div>
          </div>
        </SceneShell>
      );
    case "catalog":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 ring-1 ring-mint/45">
              <DemoImg
                src={DEMO_STORY.images.thumb}
                alt="Лот на бирже"
                className="h-14 w-14 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{DEMO_STORY.itemTitle}</p>
                <p className="text-xs text-leaf">Вам подходит · дерево</p>
                <p className="text-xs font-medium text-ink">ориентир 45–60 BYN</p>
              </div>
              <span className="hidden rounded-lg bg-mint px-2 py-1 text-[10px] font-semibold text-on-mint sm:inline">
                Взять
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-muted/40 p-2.5 opacity-65">
              <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm text-ink">Монитор 19″</p>
                <p className="text-xs text-leaf">электроника</p>
              </div>
            </div>
          </div>
        </SceneShell>
      );
    case "claim":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="space-y-3 text-sm">
            <p className="text-leaf">
              {DEMO_STORY.freelancer} откликается на «{DEMO_STORY.itemTitle}»
            </p>
            <div className="rounded-xl border border-line bg-surface p-3">
              <p className="text-xs text-leaf">Стартовый оффер</p>
              <p className="mt-1 text-xl font-semibold text-ink">45,00 BYN</p>
              <p className="mt-2 text-xs leading-5 text-leaf">
                Включая материалы. Срок — до пятницы.
              </p>
            </div>
            <div className="h-9 rounded-xl bg-mint/85 text-center text-xs font-semibold leading-9 text-on-mint">
              Отправить предложение
            </div>
          </div>
        </SceneShell>
      );
    case "deal":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <StaggerChat lines={step.chat ?? []} active={active} asDonorView />
          <p className="rounded-xl bg-mint/25 px-3 py-2 text-center text-sm font-medium text-ink ring-1 ring-mint/40">
            Принято · {DEMO_STORY.dealByn} BYN
          </p>
        </SceneShell>
      );
    case "chat":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <StaggerChat lines={step.chat ?? []} active={active} asDonorView />
        </SceneShell>
      );
    case "timeline":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="flex flex-col gap-3 py-2">
            {[
              { label: "ASSIGNED", done: true },
              { label: "IN_PROGRESS", done: true },
              { label: "COMPLETED", done: true, accent: true },
            ].map((row, index, arr) => (
              <div key={row.label} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    row.accent
                      ? "bg-mint text-on-mint"
                      : "bg-surface text-ink ring-1 ring-line"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{row.label}</p>
                  <p className="text-xs text-leaf">
                    {index === 0
                      ? "Заказ назначен"
                      : index === 1
                        ? "Ремонт в работе"
                        : "Фрилансер завершил заказ"}
                  </p>
                </div>
                {index < arr.length - 1 ? (
                  <span className="text-leaf" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </SceneShell>
      );
    case "photos":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <figure className="overflow-hidden rounded-xl border border-line">
              <DemoImg
                src={DEMO_STORY.images.before}
                alt="До ремонта"
                className="h-28 w-full sm:h-36"
              />
              <figcaption className="bg-surface px-2 py-1.5 text-center text-[11px] text-leaf">
                До
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-xl border border-line ring-1 ring-mint/40">
              <DemoImg
                src={DEMO_STORY.images.after}
                alt="После ремонта"
                className="h-28 w-full sm:h-36"
              />
              <figcaption className="bg-surface px-2 py-1.5 text-center text-[11px] font-medium text-ink">
                После
              </figcaption>
            </figure>
          </div>
        </SceneShell>
      );
    case "act":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-line bg-surface p-3 leading-6 text-leaf">
              <p className="font-medium text-ink">Черновик акта возврата</p>
              <p className="mt-1 text-xs">
                {DEMO_STORY.itemTitle} · принято {DEMO_STORY.donor} · исполнитель{" "}
                {DEMO_STORY.freelancer}
              </p>
              <p className="mt-1 text-xs">Цена ремонта: {DEMO_STORY.dealByn} BYN</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
              <span className="text-leaf">Статус предмета</span>
              <span className="font-semibold text-ink">CLOSED</span>
            </div>
            <div className="h-9 rounded-xl bg-mint/85 text-center text-xs font-semibold leading-9 text-on-mint">
              Подтвердить получение
            </div>
          </div>
        </SceneShell>
      );
    case "district":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-leaf">Факт экономии</p>
            <p className="text-3xl font-semibold tracking-tight text-ink">
              +{DEMO_STORY.savingByn}
              <span className="ml-1 text-base font-medium text-leaf">BYN</span>
            </p>
            <div className="grid grid-cols-3 gap-2 text-left text-[11px]">
              <div className="rounded-xl bg-muted/70 p-2">
                <p className="text-leaf">Новая</p>
                <p className="font-medium text-ink">{DEMO_STORY.newPriceByn}</p>
              </div>
              <div className="rounded-xl bg-muted/70 p-2">
                <p className="text-leaf">Ремонт</p>
                <p className="font-medium text-ink">{DEMO_STORY.repairByn}</p>
              </div>
              <div className="rounded-xl bg-muted/70 p-2">
                <p className="text-leaf">Утиль</p>
                <p className="font-medium text-ink">{DEMO_STORY.disposalByn}</p>
              </div>
            </div>
            <div className="mx-auto h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[78%] rounded-full bg-mint" />
            </div>
            <p className="text-xs leading-5 text-leaf">
              Экономия закупки + избегнутая утилизация · {DEMO_STORY.school}
            </p>
          </div>
        </SceneShell>
      );
    case "outro":
      return (
        <SceneShell screenLabel={step.screenLabel} role={step.role}>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
            <p className="text-lg font-semibold text-ink">Сценарий показан</p>
            <p className="max-w-sm text-sm leading-6 text-leaf">
              Ничего не записано в базу. Закройте демо и войдите как завхоз, фрилансер или
              аналитик — чтобы пройти путь на реальных данных.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-[11px]">
              <span className="rounded-full bg-muted px-2.5 py-1 text-ink">Кабинет</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-ink">Биржа</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-ink">Чат</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-ink">Район</span>
            </div>
          </div>
        </SceneShell>
      );
    default:
      return null;
  }
}

export function DemoWalkthrough({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const steps = DEMO_WALKTHROUGH_STEPS;
  const step = steps[index]!;
  const isLast = index >= steps.length - 1;

  const lastIndex = steps.length - 1;

  const reset = useEffectEvent(() => {
    setIndex(0);
    setPlaying(true);
  });

  /** Надёжная навигация: functional update + стоп автоплея (без stale index). */
  function jumpTo(next: number) {
    setPlaying(false);
    setIndex(() => Math.max(0, Math.min(lastIndex, next)));
  }

  function stepBy(delta: number) {
    setPlaying(false);
    setIndex((current) => Math.max(0, Math.min(lastIndex, current + delta)));
  }

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepBy(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBy(-1);
      } else if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, lastIndex]);

  useEffect(() => {
    if (!open || !playing || isLast) return;
    const timer = window.setTimeout(() => {
      setIndex((value) => Math.min(lastIndex, value + 1));
    }, step.durationMs);
    return () => window.clearTimeout(timer);
  }, [open, playing, index, isLast, step.durationMs, lastIndex]);

  if (!open || typeof document === "undefined") return null;

  const stop = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(10,8,6,0.88)] p-2 backdrop-blur-[3px] sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(96dvh,54rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.5rem] border border-line-strong bg-surface shadow-[0_24px_60px_rgba(20,16,12,0.55)] sm:rounded-[1.75rem]"
        onClick={stop}
        onPointerDown={stop}
      >
        <header className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              Демо · без записи в базу
            </p>
            <h2 id={titleId} className="text-lg font-semibold text-ink sm:text-xl">
              Как работает ReSchool
            </h2>
            <p className="mt-0.5 text-xs text-leaf">
              {DEMO_STORY.itemTitle} · {DEMO_STORY.school} · шаг {index + 1} из {steps.length}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={(event) => {
                stop(event);
                jumpTo(lastIndex);
              }}
              className="rounded-xl border border-line bg-muted/40 px-2.5 py-1.5 text-xs text-leaf hover:bg-muted"
            >
              К финалу
            </button>
            <button
              type="button"
              onClick={(event) => {
                stop(event);
                onClose();
              }}
              className="rounded-xl border border-line bg-muted/50 px-2.5 py-1.5 text-xs text-ink hover:bg-muted"
            >
              Закрыть
            </button>
          </div>
        </header>

        <div className="relative z-10 flex shrink-0 gap-1 px-4 pt-3 sm:hidden">
          {steps.map((row, i) => (
            <button
              key={row.id}
              type="button"
              aria-label={row.shortLabel}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index ? "bg-mint" : "bg-line"
              }`}
              onClick={(event) => {
                stop(event);
                jumpTo(i);
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex shrink-0 gap-2 overflow-x-auto px-4 py-2 sm:hidden">
          {steps.map((row, i) => (
            <button
              key={`chip-${row.id}`}
              type="button"
              onClick={(event) => {
                stop(event);
                jumpTo(i);
              }}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                i === index
                  ? "bg-mint text-on-mint"
                  : "bg-muted text-leaf hover:text-ink"
              }`}
            >
              {row.shortLabel}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-x-hidden overflow-y-auto border-r border-line md:block">
            <ol className="flex flex-col gap-1 p-3 pr-3">
              {steps.map((row, i) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={(event) => {
                      stop(event);
                      jumpTo(i);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                      i === index
                        ? "bg-mint/25 text-ink"
                        : "text-leaf hover:bg-muted/70 hover:text-ink"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-semibold ring-1 ring-line">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {row.shortLabel}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-leaf">
                {step.role}
              </p>
              <h3 className="text-base font-semibold text-ink sm:text-lg">{step.title}</h3>
              <p className="text-sm leading-6 text-leaf">{step.narration}</p>
            </div>
            <DemoScene key={step.id} step={step} active />
            <p className="text-[11px] text-leaf">
              Клавиши: ← → шаги, Space — пауза/авто, Esc — закрыть
            </p>
          </div>
        </div>

        <footer
          className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3 sm:px-5"
          onClick={stop}
          onPointerDown={stop}
        >
          <button
            type="button"
            className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-muted disabled:opacity-40"
            disabled={index === 0}
            onClick={(event) => {
              stop(event);
              stepBy(-1);
            }}
            onPointerDown={stop}
          >
            Назад
          </button>
          <div className="flex flex-wrap gap-2">
            {!isLast ? (
              <>
                <button
                  type="button"
                  className="rounded-xl border border-line px-3 py-2 text-xs text-ink hover:bg-muted"
                  onClick={(event) => {
                    stop(event);
                    setPlaying((value) => !value);
                  }}
                  onPointerDown={stop}
                >
                  {playing ? "Пауза" : "Авто"}
                </button>
                <button
                  type="button"
                  className="btn-primary px-4 py-2 text-xs"
                  onClick={(event) => {
                    stop(event);
                    stepBy(1);
                  }}
                  onPointerDown={stop}
                >
                  Дальше
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-primary px-4 py-2 text-xs"
                onClick={(event) => {
                  stop(event);
                  onClose();
                }}
                onPointerDown={stop}
              >
                Готово · ко входу
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/** Кнопка + оверлей для экрана входа. */
export function DemoWalkthroughTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex w-full items-center justify-center rounded-2xl border border-line-strong bg-muted/55 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-muted ${className}`}
      >
        Прогнать демо
      </button>
      <DemoWalkthrough open={open} onClose={() => setOpen(false)} />
    </>
  );
}
