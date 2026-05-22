import { App, Modal, Component, MarkdownRenderer } from "obsidian";
import type TableColorPlugin from "../plugin";

export class ChangelogModal extends Modal {
    plugin: TableColorPlugin;
    _mdComp: Component | null = null;

    constructor(app: App, plugin: TableColorPlugin) {
        super(app);
        this.plugin = plugin;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        try {
            this.modalEl.setCssStyles({
                maxWidth: "900px",
                width: "900px",
                padding: "25px"
            });
        } catch { /* ignore */ }

        const header = contentEl.createEl("div");
        header.setCssStyles({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--divider-color)"
        });

        const title = header.createEl("h2", { text: "Color table cells" });
        title.setCssStyles({
            margin: "0",
            fontSize: "1.5em",
            fontWeight: "600"
        });

        const link = header.createEl("a", { text: "View on GitHub" });
        link.href = "https://github.com/Kazi-Aidah/color-table-cells/releases";
        link.target = "_blank";
        link.setCssStyles({
            fontSize: "0.9em",
            opacity: "0.8",
            transition: "opacity 0.2s"
        });
        link.addEventListener("mouseenter", () => link.setCssStyles({ opacity: "1" }));
        link.addEventListener("mouseleave", () => link.setCssStyles({ opacity: "0.8" }));

        const body = contentEl.createDiv();
        body.setCssStyles({
            maxHeight: "70vh",
            overflow: "auto"
        });

        const loading = body.createEl("div", { text: "Loading releases..." });
        loading.setCssStyles({
            opacity: "0.7",
            fontSize: "0.95em",
            marginTop: "12px"
        });

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rels = await (this.plugin as any).fetchAllReleases();
            body.empty();
            if (!Array.isArray(rels) || rels.length === 0) {
                const noInfo = body.createEl("div", { text: "No release information available." });
                noInfo.setCssStyles({ marginTop: "12px" });
                return;
            }

            rels.forEach((rel) => {
                void (async () => {
                const meta = body.createEl("div");
                meta.setCssStyles({
                    marginBottom: "6px",
                    borderBottom: "1px solid var(--divider-color)"
                });

                const releaseName = meta.createEl("div", { text: rel.name || rel.tag_name || "Release" });
                releaseName.setCssStyles({
                    fontSize: "2em",
                    fontWeight: "900",
                    marginTop: "12px",
                    marginBottom: "12px",
                    color: "var(--text-normal)"
                });

                try {
                    const dateRaw = rel.published_at || rel.created_at || rel.release_date || null;
                    if (dateRaw) {
                        const dt = new Date(dateRaw);
                        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        const formatted = `${dt.getFullYear()} ${monthNames[dt.getMonth()]} ${String(dt.getDate()).padStart(2, "0")}`;
                        const dateEl = meta.createEl("div", { text: formatted });
                        dateEl.setCssStyles({
                            display: "block",
                            opacity: "0.8",
                            fontSize: "0.9em",
                            marginTop: "-4px",
                            marginBottom: "16px"
                        });
                    }
                } catch { /* ignore */ }

                const notes = body.createEl("div");
                notes.setCssStyles({
                    marginTop: "0px",
                    lineHeight: "1.6",
                    fontSize: "0.95em"
                });
                notes.addClass("markdown-preview-view");
                try {
                    notes.setCssStyles({ padding: "0 var(--file-margin)" });
                } catch { /* ignore */ }

                const md = rel.body || "No notes";
                try {
                    if (!this._mdComp) {
                        this._mdComp = new Component();
                    }
                    await MarkdownRenderer.render(this.plugin.app, md, notes, "", this._mdComp);
                } catch {
                    const preEl = notes.createEl("pre");
                    preEl.setCssStyles({
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                        backgroundColor: "var(--background-secondary)",
                        padding: "12px",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        lineHeight: "1.5"
                    });
                    preEl.textContent = md;
                }
                })();
            });
        } catch {
            body.empty();
            const failed = body.createEl("div", { text: "Failed to load release notes." });
            failed.setCssStyles({ marginTop: "12px" });
        }
    }

    onClose() {
        try {
            if (this._mdComp) {
                this._mdComp.unload();
            }
        } catch { /* ignore */ }
        this._mdComp = null;
        this.contentEl.empty();
    }
}
