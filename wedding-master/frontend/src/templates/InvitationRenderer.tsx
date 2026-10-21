import { Suspense } from "react";
import type { InvitationData } from "../types/invitation";
import { InvitationProvider, type TemplateMode } from "./shared/InvitationContext";
import { TEMPLATES } from "./registry";

interface Props {
  data: InvitationData;
  id?: string;
  mode: TemplateMode;
  basePath: string;
}

/** Taklifnomani tanlangan shablon bilan chizadi (shablon kodi alohida yuklanadi). */
export function InvitationRenderer({ data, id, mode, basePath }: Props) {
  const template = TEMPLATES[data.template] ?? TEMPLATES.bog;
  const { Component } = template;
  return (
    <InvitationProvider
      data={data}
      id={id}
      mode={mode}
      basePath={basePath}
      defaultMusic={template.defaultMusic}
    >
      <Suspense fallback={<FullPageLoader />}>
        <Component />
      </Suspense>
    </InvitationProvider>
  );
}

export function FullPageLoader({ label = "Yuklanmoqda..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-3 text-ink/50">
        <span className="h-8 w-8 rounded-full border-2 border-ink/15 border-t-rose animate-spin" />
        <span className="font-sans text-xs tracking-[0.2em] uppercase">{label}</span>
      </div>
    </div>
  );
}
