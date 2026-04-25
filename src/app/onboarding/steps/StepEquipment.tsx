"use client";

import { useEffect } from "react";
import type { OnboardingData, StepProps } from "../types";

type Equipment = NonNullable<OnboardingData["equipmentAccess"]>;
type EquipmentKey = keyof Equipment;

const ITEMS: { key: EquipmentKey; label: string; description: string }[] = [
  { key: "sled", label: "Sled", description: "Sled push & pull station" },
  { key: "wallBall", label: "Wall Ball", description: "Wall ball throw station" },
  { key: "skiErg", label: "Ski Erg", description: "Ski erg machine" },
  { key: "rower", label: "Rower", description: "Rowing machine" },
];

const DEFAULT_EQUIPMENT: Equipment = {
  sled: false,
  wallBall: false,
  skiErg: false,
  rower: false,
};

export function StepEquipment({ formData, updateFormData, onValidChange }: StepProps) {
  const equipment = formData.equipmentAccess ?? DEFAULT_EQUIPMENT;

  useEffect(() => {
    if (!formData.equipmentAccess) {
      updateFormData({ equipmentAccess: DEFAULT_EQUIPMENT });
    }
    onValidChange(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(key: EquipmentKey) {
    updateFormData({
      equipmentAccess: { ...equipment, [key]: !equipment[key] },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">What equipment do you have access to?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Coach substitutes around whatever you don&apos;t have.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map(({ key, label, description }) => {
          const checked = equipment[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={[
                "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-secondary",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded border text-[10px] transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  ].join(" ")}
                >
                  {checked && "✓"}
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground">{description}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[12px] text-muted-foreground">
        Not checking anything is fine — we&apos;ll plan around standard gym equipment.
      </p>
    </div>
  );
}
