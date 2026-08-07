export type FormActionState = {
  message?: string;
  ok?: boolean;
};

export function getActionErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrio un error inesperado.";
}

