"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import {
  updateProductStatusFormAction,
  type ProductUpdateFormState,
} from "./actions";

const initialState: ProductUpdateFormState = {};

export function ProductStatusInlineForm({
  productId,
  currentStatus,
}: {
  productId: string;
  currentStatus: "ACTIVE" | "INACTIVE";
}) {
  const [state, formAction] = useActionState(
    updateProductStatusFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="productId" type="hidden" value={productId} />
      <input name="status" type="hidden" value={currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
      <button className="rounded border border-[var(--border)] px-3 py-1" type="submit">
        {currentStatus === "ACTIVE" ? "Desactivar" : "Activar"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

