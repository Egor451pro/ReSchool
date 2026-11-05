import { HomeStartClient } from "@/components/home-start-client";

export function DemoLogins({ next }: { next?: string }) {
  return <HomeStartClient title="Выберите роль" next={next} />;
}
