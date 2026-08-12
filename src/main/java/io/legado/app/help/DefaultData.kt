package io.legado.app.help

// import io.legado.app.data.entities.RssSource
import io.legado.app.data.entities.TxtTocRule
import io.legado.app.utils.GSON
import io.legado.app.utils.fromJsonArray

object DefaultData {
    const val txtTocRuleFileName = "txtTocRule.json"

    val txtTocRules: List<TxtTocRule> by lazy {
        // classpath 内资源必须用 '/' 分隔符（不能用 File.separator，Windows 上为 '\' 会导致 getResource 找不到资源）。
        // 资源位于 classpath 根：defaultData/txtTocRule.json
        val json = String(DefaultData::class.java.getResource("/defaultData/$txtTocRuleFileName").readBytes())
        GSON.fromJsonArray<TxtTocRule>(json).getOrNull() ?: emptyList()
    }

    // val rssSources by lazy {
    //     val json = String(
    //         File("defaultData${File.separator}rssSources.json")
    //             .readBytes()
    //     )
    //     GSON.fromJsonArray<RssSource>(json)!!
    // }
}