let seq = 0;

export function uid():string {
  return '_' + (seq++).toString(36);
}
