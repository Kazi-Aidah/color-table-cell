import { App, Modal, MarkdownRenderer, Component } from "obsidian";
import type TableColorPlugin from "../plugin";

export class ChangelogModal extends Modal {
  private plugin: TableColorPlugin;

  constructor(app: App, plugin: TableColorPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    const { contentEl, modalEl } = this;
    modalEl.addClass("ctc-release-modal");

    const header = contentEl.createDiv({ cls: "ctc-release-header" });
    header.createEl("h2", { text: "Release Notes", cls: "ctc-release-title" });
    const ghLink = header.createEl("a", {
      text: "View on GitHub",
      cls: "ctc-release-link",
    });
    ghLink.href = "https://github.com/Kazi-Aidah/color-table-cells/releases";
    ghLink.target = "_blank";

    const body = contentEl.createDiv({ cls: "ctc-release-body" });
    const loading = body.createEl("p", {
      text: "Loading release notes...",
      cls: "ctc-release-loading",
    });

    try {
      const markdown = await this.plugin.fetchChangelog();
      loading.remove();

      if (!markdown || !markdown.trim()) {
        body.createEl("p", {
          text: "No release notes available.",
          cls: "ctc-release-empty",
        });
        return;
      }

      const notesEl = body.createDiv({ cls: "ctc-release-notes" });
      try {
        await MarkdownRenderer.render(
          this.app,
          markdown,
          notesEl,
          "",
          new Component(),
        );
      } catch {
        notesEl.createEl("pre", {
          text: markdown,
          cls: "ctc-release-notes-fallback",
        });
      }
    } catch {
      loading.remove();
      body.createEl("p", {
        text: "Failed to load release notes. Check your internet connection.",
        cls: "ctc-release-error",
      });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
