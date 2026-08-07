<template>
  <div class="filter-rules-overlay" v-if="visible" @click.self="close">
    <div
      class="filter-rules-panel"
      :class="{ night: $store.getters.isNight }"
    >
      <div class="panel-header">
        <span class="panel-title">过滤规则管理</span>
        <span class="panel-count">{{ filterRules.length }} 条</span>
        <span class="panel-close" @click="close">✕</span>
      </div>

      <div class="panel-body">
        <!-- 添加规则区 -->
        <div class="add-section">
          <div class="add-title">添加新规则</div>
          <div class="add-form">
            <input
              v-model="newRule.pattern"
              placeholder="要过滤的关键词（支持正则）"
              class="fr-input"
              @keyup.enter="addRule"
            />
            <input
              v-model="newRule.replacement"
              placeholder="替换为（留空则删除该文本）"
              class="fr-input"
              @keyup.enter="addRule"
            />
          </div>
          <div class="add-row">
            <label class="fr-label">适用范围：</label>
            <select v-model="newRule.scopeType" class="fr-select" @change="onScopeTypeChange">
              <option value="book">当前书籍</option>
              <option value="all">所有书籍</option>
            </select>
            <span class="scope-hint" v-if="newRule.scopeType === 'book'">
              {{ scopeBookName || "未打开书籍" }}
            </span>
          </div>
          <button class="fr-btn fr-btn-add" @click="addRule">添加规则</button>
        </div>

        <!-- 规则列表 -->
        <div class="rules-list-section" v-if="filterRules.length > 0">
          <div class="list-header">
            <span class="lh-pattern">关键词</span>
            <span class="lh-replacement">替换为</span>
            <span class="lh-scope">适用范围</span>
            <span class="lh-action">操作</span>
          </div>
          <div
            class="list-row"
            v-for="(rule, index) in filterRules"
            :key="index"
          >
            <span class="lr-pattern" :title="rule.pattern">{{ rule.pattern }}</span>
            <span class="lr-replacement" :title="rule.replacement">
              {{ rule.replacement || "（删除）" }}
            </span>
            <span class="lr-scope" :title="rule.scope">{{ formatScope(rule.scope) }}</span>
            <span class="lr-action">
              <button class="fr-btn fr-btn-del" @click="removeRule(index)">删除</button>
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else>
          <p>暂无过滤规则</p>
          <p class="empty-sub">添加规则后，阅读时将自动过滤对应内容</p>
        </div>
      </div>

      <div class="panel-footer">
        <button class="fr-btn fr-btn-clear" v-if="filterRules.length > 0" @click="clearAll">
          清空全部
        </button>
        <button class="fr-btn fr-btn-done" @click="close">完成</button>
      </div>
    </div>
  </div>
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
      }
    };
  },
  computed: {
    filterRules() {
      return this.$store.state.filterRules || [];
    },
    scopeBookName() {
      const book = this.$store.state.readingBook;
      return book ? `${book.bookName || ""} / ${book.author || ""}` : "";
    }
  },
  methods: {
    onScopeTypeChange() {
      // 切换范围类型时不需要额外操作
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

      this.$message.success("添加成功");
    },
    removeRule(index) {
      const rules = [].concat(this.filterRules);
      rules.splice(index, 1);
      this.$store.commit("setFilterRules", rules);
      this.$message.success("已删除");
    },
    clearAll() {
      this.$confirm("确定要清空所有过滤规则吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.$store.commit("setFilterRules", []);
        this.$message.success("已清空");
      });
    },
    close() {
      this.$emit("close");
    }
  }
};
</script>

<style lang="stylus" scoped>
.filter-rules-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
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
    max-height: 100vh;
    border-radius: 0;
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
  }
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

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

    &:hover {
      opacity: 1;
    }
  }
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
}

.fr-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #409eff;
  }
}

.fr-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;

  option {
    background: #fff;
    color: #333;
  }
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

  &:hover {
    opacity: 0.85;
  }
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

  &:hover {
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
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;

  p {
    margin: 4px 0;
  }

  .empty-sub {
    font-size: 12px;
    opacity: 0.6;
  }
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

  .panel-header {
    border-color: #444;
  }

  .list-header {
    background: rgba(255, 255, 255, 0.06);
    color: #ddd;
  }

  .list-row {
    border-color: #444;
    color: #ddd;

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }

  .fr-input,
  .fr-select {
    background: #3a3a3a;
    border-color: #555;
    color: #eee;

    &::placeholder {
      color: #999;
    }

    option {
      background: #3a3a3a;
      color: #eee;
    }
  }

  .panel-footer {
    border-color: #444;
  }

  .rules-list-section {
    border-color: #444;
  }

  .empty-state {
    color: #999;
  }

  .fr-btn-clear {
    border-color: #555;
    color: #eee;
  }

  .fr-label {
    color: #bbb;
  }

  .scope-hint {
    color: #999;
  }
}
</style>
