export interface SignatureParams {
  project: string
  name: string
  role: string
  email: string
  phone: string
  mode: string
}

export type SignatureResult =
  | { html: string }
  | { error: string; status: number }
