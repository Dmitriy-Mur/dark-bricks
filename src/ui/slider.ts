/** A draggable 0..1 bar. Updates itself; the caller only stores the value. */
export function volumeSlider(
  label: string,
  initial: number,
  name: string,
  onChange: (value: number) => void,
): UIRow {
  let value = Math.max(0, Math.min(1, initial))
  const fill = UIBox().style({
    width: "0%",
    height: "100%",
    backgroundColor: "#8a3a32",
    borderRadius: 4,
  })
  const track = UIBox(fill).style({
    width: "100%",
    height: 8,
    backgroundColor: "#2a2420",
    borderRadius: 4,
    overflow: "hidden",
  })
  const knob = UIBox().style({
    position: "absolute",
    left: "0%",
    top: 6,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: "#e8dcc8",
  })

  const paint = () => {
    const pct = `${Math.round(value * 1000) / 10}%` as `${number}%`
    fill.style.width = pct
    knob.style.left = pct
  }
  paint()

  const hit = UIButton(track, knob)
    .named(name)
    .style({
      position: "relative",
      flexGrow: 1,
      height: 28,
      backgroundColor: "#00000000",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 0,
    })

  const apply = (clientX: number) => {
    const box = hit.getBoundingClientRect()
    if (!box || box.width <= 0) return
    const next = Math.max(0, Math.min(1, (clientX - box.left) / box.width))
    value = Math.round(next * 100) / 100
    paint()
    onChange(value)
  }

  hit.onTouchStart((ev) => {
    apply(ev.clientX)
    ev.track({
      claim: "pan-x",
      onMove: (e) => apply(e.clientX),
    })
  })

  return UIRow(
    UIText(label).style({ color: "#c8bfb0", fontSize: 13, width: 72 }),
    hit,
  ).style({ marginTop: 8, alignItems: "center", gap: 8, width: "100%" })
}
