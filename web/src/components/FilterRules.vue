<template>
  <!-- 空模板：内容通过原生 DOM 挂载到 document.body 下 -->
  <div ref="portalRoot" style="display:none"></div>
</template>

<script>
export default {
  name: "FilterRules",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      newRule: {
        pattern: "",
        replacement: "",
        scopeType: "book"
      },
      mountedBody: false
    };
  },
  computed: {
    filterRules() {
      return this.$store.state.filterRules || [];
    },
    scopeBookName() {
      const book = this.$store.state.readingBook;
      return book ? `${book.bookName || ""} / ${book.author || ""}` : "";
    },
    isNight() {
      return this.$store.getters.isNight;
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.mountToBody();
        } else {
          this.unmountFromBody();
        }
      }
    }
  },
  mounted() {
    if (this.visible) this.mountToBody();
  },
  beforeDestroy() {
    this.unmountFromBody();
  },
  methods: {
    mountToBody() {
      if (this.mountedBody) return;
      // 关闭可能仍悬浮在顶部的设置面板（el-popover，z-index 通常高于本浮层），
      // 否则在 iPhone 上设置面板会压住过滤规则浮层顶部，导致“过滤规则被设置遮挡”。
      try {
        document.querySelectorAll(".el-popover").forEach(el => {
          if (el !== this._overlayEl) el.style.display = "none";
        });
      } catch (e) {
        //
      }
      // 双重保险：临时隐藏 App 根，让顶栏（首页/书架/书源/目录/设置/顶部/底部）
      // 没法浮在过滤规则之上。卸载时恢复。
      const appEl = document.getElementById("app");
      if (appEl) appEl.style.visibility = "hidden";
      const el = this.createOverlay();
      document.body.appendChild(el);
      this._overlayEl = el;
      this.mountedBody = true;
      // 禁止底层滚动
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    },
    unmountFromBody() {
      if (!this.mountedBody || !this._overlayEl) return;
      if (this._overlayEl.parentNode) {
        this._overlayEl.parentNode.removeChild(this._overlayEl);
      }
      this._overlayEl = null;
      this.mountedBody = false;
      // 恢复 App 根可见
      const appEl = document.getElementById("app");
      if (appEl) appEl.style.visibility = "";
      // 恢复底层滚动
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    },
    createOverlay() {
      const div = document.createElement("div");
      div.className = "filter-rules-overlay" + (this.isNight ? " night" : "");
      div.innerHTML = this.getPanelHTML();
      // 绑定事件
      div.addEventListener("click", e => {
        if (e.target === div) this.close();
      });
      // 绑定按钮事件
      const closeBtn = div.querySelector(".panel-close");
      if (closeBtn) closeBtn.addEventListener("click", () => this.close());

      const addBtn = div.querySelector(".fr-btn-add");
      if (addBtn) addBtn.addEventListener("click", () => this.addRule());

      const doneBtn = div.querySelector(".fr-btn-done");
      if (doneBtn) doneBtn.addEventListener("click", () => this.close());

      const clearBtn = div.querySelector(".fr-btn-clear");
      if (clearBtn) clearBtn.addEventListener("click", () => this.clearAll());

      // 绑定删除按钮
      const delBtns = div.querySelectorAll(".fr-btn-del");
      delBtns.forEach((btn, idx) => {
        btn.addEventListener("click", () => this.removeRule(idx));
      });

      // 绑定输入框 enter
      const inputs = div.querySelectorAll(".fr-input");
      inputs.forEach(input => {
        input.addEventListener("keyup", e => {
          if (e.key === "Enter") this.addRule();
        });
      });

      // 绑定 scope 选择变化
      const select = div.querySelector(".fr-select");
      if (select) {
        select.addEventListener("change", () => {
          this.newRule.scopeType = select.value;
        });
      }

      return div;
    },
    getPanelHTML() {
      const scopeHint =
        this.newRule.scopeType === "book"
          ? this.scopeBookName || "未打开书籍"
          : "";
      const scopeDisplay =
        this.newRule.scopeType === "book" ? "" : "display:none";

      let rulesHTML = "";
      if (this.filterRules.length > 0) {
        rulesHTML = `
          <div class="rules-list-section">
            <div class="list-header">
              <span class="lh-pattern">关键词</span>
              <span class="lh-replacement">替换为</span>
              <span class="lh-scope">适用范围</span>
              <span class="lh-action">操作</span>
            </div>
            ${this.filterRules
              .map(
                (rule, index) => `
              <div class="list-row" data-index="${index}">
                <span class="lr-pattern" title="${this.escapeHtml(
                  rule.pattern
                )}">${this.escapeHtml(rule.pattern)}</span>
                <span class="lr-replacement" title="${this.escapeHtml(
                  rule.replacement || ""
                )}">${
                  rule.replacement
                    ? this.escapeHtml(rule.replacement)
                    : "（删除）"
                }</span>
                <span class="lr-scope" title="${this.escapeHtml(
                  rule.scope || ""
                )}">${this.formatScope(rule.scope)}</span>
                <span class="lr-action">
                  <button class="fr-btn fr-btn-del">删除</button>
                </span>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      } else {
        rulesHTML = `
          <div class="empty-state">
            <p>暂无过滤规则</p>
            <p class="empty-sub">添加规则后，阅读时将自动过滤对应内容</p>
          </div>
        `;
      }

      return `
        <div class="filter-rules-panel">
          <div class="panel-header">
            <span class="panel-title">过滤规则管理</span>
            <span class="panel-count">${this.filterRules.length} 条</span>
            <span class="panel-close">✕</span>
          </div>
          <div class="panel-body">
            <div class="add-section">
              <div class="add-title">添加新规则</div>
              <div class="add-form">
                <input class="fr-input fr-input-pattern" placeholder="要过滤的关键词（支持正则）" value="${this.escapeHtml(
                  this.newRule.pattern
                )}" />
                <input class="fr-input fr-input-replacement" placeholder="替换为（留空则删除该文本）" value="${this.escapeHtml(
                  this.newRule.replacement
                )}" />
              </div>
              <div class="add-row">
                <label class="fr-label">适用范围：</label>
                <select class="fr-select">
                  <option value="book" ${
                    this.newRule.scopeType === "book" ? "selected" : ""
                  }>当前书籍</option>
                  <option value="all" ${
                    this.newRule.scopeType === "all" ? "selected" : ""
                  }>所有书籍</option>
                </select>
                <span class="scope-hint" style="${scopeDisplay}">${this.escapeHtml(
        scopeHint
      )}</span>
              </div>
              <button class="fr-btn fr-btn-add">添加规则</button>
            </div>
            ${rulesHTML}
          </div>
          <div class="panel-footer">
            ${
              this.filterRules.length > 0
                ? '<button class="fr-btn fr-btn-clear">清空全部</button>'
                : ""
            }
            <button class="fr-btn fr-btn-done">完成</button>
          </div>
        </div>
      `;
    },
    escapeHtml(text) {
      if (!text) return "";
      return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    onScopeTypeChange() {
      // 不需要额外操作，通过 DOM 事件监听
    },
    buildScope() {
      if (this.newRule.scopeType === "all") {
        return ";";
      }
      const book = this.$store.state.readingBook;
      if (book) {
        return `${book.bookName || ""};${book.author || ""}`;
      }
      return ";";
    },
    formatScope(scope) {
      if (!scope || scope === ";") {
        return "所有书籍";
      }
      const parts = scope.split(";");
      if (parts[0]) {
        return parts[1] ? `${parts[0]} / ${parts[1]}` : parts[0];
      }
      return "所有书籍";
    },
    addRule() {
      // 从 DOM 读取当前输入值
      if (this._overlayEl) {
        const patternInput = this._overlayEl.querySelector(".fr-input-pattern");
        const replacementInput = this._overlayEl.querySelector(
          ".fr-input-replacement"
        );
        const select = this._overlayEl.querySelector(".fr-select");
        if (patternInput) this.newRule.pattern = patternInput.value;
        if (replacementInput) this.newRule.replacement = replacementInput.value;
        if (select) this.newRule.scopeType = select.value;
      }

      const pattern = this.newRule.pattern.trim();
      if (!pattern) {
        this.$message.warning("关键词不能为空");
        return;
      }

      if (this.newRule.scopeType === "book" && !this.$store.state.readingBook) {
        this.$message.warning('未打开书籍，请选择"所有书籍"');
        return;
      }

      const rule = {
        pattern: pattern,
        replacement: this.newRule.replacement || "",
        scope: this.buildScope()
      };

      this.$store.commit("addFilterRule", rule);

      this.newRule = {
        pattern: "",
        replacement: "",
        scopeType: "book"
      };

      // 刷新 DOM
      this.refreshOverlay();
      this.$message.success("添加成功");
    },
    removeRule(index) {
      const rules = [].concat(this.filterRules);
      rules.splice(index, 1);
      this.$store.commit("setFilterRules", rules);
      this.refreshOverlay();
      this.$message.success("已删除");
    },
    clearAll() {
      // 不再隐藏过滤规则面板（el-message-box 通过 zIndex 选项显式置顶，
      // 让确认框在过滤规则之上显示而不是被遮住）。
      this.$confirm("确定要清空所有过滤规则吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        zIndex: 3000
      }).then(() => {
        this.$store.commit("setFilterRules", []);
        this.refreshOverlay();
        this.$message.success("已清空");
      }).catch(() => {
        // 用户取消，无需任何操作
      });
    },
    close() {
      this.unmountFromBody();
      this.$emit("close");
    },
    refreshOverlay() {
      if (this._overlayEl) {
        const wasNight = this._overlayEl.classList.contains("night");
        const parent = this._overlayEl.parentNode;
        if (parent) parent.removeChild(this._overlayEl);
        const newEl = this.createOverlay();
        if (wasNight) newEl.classList.add("night");
        if (this.isNight) newEl.classList.add("night");
        document.body.appendChild(newEl);
        this._overlayEl = newEl;
      }
    }
  }
};
</script>

<style lang="stylus">
/* 注意：样式不使用 scoped，因为 DOM 是动态挂载到 body 下的 */
.filter-rules-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  /* z-index 必须高于 App 顶栏（首页/书架/书源/目录/设置/顶部/底部），且低于
     clearAll() 里的 $confirm 显式 zIndex: 3000，过滤规则：2500，确认框：3000 */
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom);
}

.filter-rules-panel {
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: #fff;
  color: #333;
}

@media screen and (max-width: 640px) {
  .filter-rules-overlay {
    align-items: flex-start;
    justify-content: center;
    padding-top: 0;
  }
  .filter-rules-panel {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    height: -webkit-fill-available;
    height: 100dvh;
    max-height: 100vh;
    max-height: -webkit-fill-available;
    max-height: 100dvh;
    border-radius: 0;
    overscroll-behavior: contain;
  }
  .panel-header {
    padding: 14px 16px;
    flex-shrink: 0;
  }
  .panel-body {
    padding: 12px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .add-form {
    flex-direction: column;
    gap: 8px;
  }
  .add-row {
    flex-wrap: wrap;
    gap: 6px;
  }
  .fr-input {
    font-size: 12px;
    padding: 7px 10px;
  }
  .fr-select {
    font-size: 12px;
    padding: 5px 8px;
  }
  .fr-btn-add {
    padding: 7px 12px;
    font-size: 12px;
  }
  .rules-list-section {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .list-header {
    grid-template-columns: 140px 100px 90px 55px;
    gap: 6px;
    padding: 8px 10px;
    font-size: 11px;
  }
  .list-row {
    grid-template-columns: 140px 100px 90px 55px;
    gap: 6px;
    padding: 8px 10px;
    font-size: 12px;
  }
  .panel-footer {
    padding: 12px 16px;
    flex-shrink: 0;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}
.panel-count {
  font-size: 12px;
  opacity: 0.6;
  margin-right: 16px;
}
.panel-close {
  cursor: pointer;
  font-size: 18px;
  opacity: 0.5;
  padding: 4px 8px;
}
.panel-close:hover {
  opacity: 1;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.add-section {
  margin-bottom: 20px;
}
.add-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  opacity: 0.8;
}
.add-form {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
}
.scope-hint {
  opacity: 0.6;
  font-size: 12px;
}

.fr-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
.fr-input:focus {
  outline: none;
  border-color: #409eff;
}

.fr-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
.fr-select option {
  background: #fff;
  color: #333;
}

.fr-label {
  opacity: 0.7;
}

.fr-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: opacity 0.2s;
}
.fr-btn:hover {
  opacity: 0.85;
}
.fr-btn-add {
  background: #409eff;
  color: #fff;
}
.fr-btn-del {
  background: #f56c6c;
  color: #fff;
  padding: 4px 10px;
  font-size: 12px;
}
.fr-btn-clear {
  background: transparent;
  border: 1px solid #ddd;
  color: inherit;
}
.fr-btn-done {
  background: #409eff;
  color: #fff;
}

.rules-list-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 70px;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.04);
  font-weight: 600;
  font-size: 12px;
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1.5fr 70px;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #eee;
  align-items: center;
  font-size: 13px;
}
.list-row:hover {
  background: rgba(0, 0, 0, 0.02);
}
.lr-pattern,
.lr-replacement,
.lr-scope {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lr-replacement {
  opacity: 0.7;
}
.lr-scope {
  opacity: 0.8;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
.empty-state p {
  margin: 4px 0;
}
.empty-sub {
  font-size: 12px;
  opacity: 0.6;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;
}

/* 夜间模式 */
.night .filter-rules-panel {
  background: #2c2c2c;
  color: #eee;
}
.night .panel-header {
  border-color: #444;
}
.night .list-header {
  background: rgba(255, 255, 255, 0.06);
  color: #ddd;
}
.night .list-row {
  border-color: #444;
  color: #ddd;
}
.night .list-row:hover {
  background: rgba(255, 255, 255, 0.04);
}
.night .fr-input,
.night .fr-select {
  background: #3a3a3a;
  border-color: #555;
  color: #eee;
}
.night .fr-input::placeholder {
  color: #999;
}
.night .fr-select option {
  background: #3a3a3a;
  color: #eee;
}
.night .panel-footer {
  border-color: #444;
}
.night .rules-list-section {
  border-color: #444;
}
.night .empty-state {
  color: #999;
}
.night .fr-btn-clear {
  border-color: #555;
  color: #eee;
}
.night .fr-label {
  color: #bbb;
}
.night .scope-hint {
  color: #999;
}
</style>
