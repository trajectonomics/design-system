import markOnLight from "@trajectonomics/design-system-assets/logo/mark-on-light.svg"
import "./app.css"

const mark = document.querySelector<HTMLImageElement>("#mark")

if (mark) mark.src = markOnLight

const toggle = document.querySelector<HTMLButtonElement>("#toggle-theme")

toggle?.addEventListener("click", () => {
	const root = document.documentElement
	root.setAttribute("data-theme", root.getAttribute("data-theme") === "dark" ? "light" : "dark")
})
