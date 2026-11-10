import "./app.css"

const toggle = document.querySelector<HTMLButtonElement>("#toggle-theme")

toggle?.addEventListener("click", () => {
	const root = document.documentElement
	root.setAttribute("data-theme", root.getAttribute("data-theme") === "dark" ? "light" : "dark")
})
