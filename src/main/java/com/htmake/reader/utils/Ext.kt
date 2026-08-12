package com.htmake.reader.utils

import io.vertx.core.buffer.Buffer
import io.vertx.ext.web.client.HttpRequest
import io.vertx.ext.web.client.WebClient
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.io.File
import java.io.OutputStream
import java.io.InputStream
import java.io.FileOutputStream
import java.io.FileInputStream
import java.util.zip.ZipFile
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

/**
 * @Date: 2019-07-19 23:43
 * @Description:
 */

fun String.url(): String {
    if (this.startsWith("//")) {
        return ("http:" + this).toHttpUrl().toString()
    } else if (this.startsWith("http")) {
        return this.toHttpUrl().toString()
    }
    return this
}

fun WebClient.getEncodeAbs(absoluteURI: String): HttpRequest<Buffer> {
    return this.getAbs(absoluteURI.toHttpUrl().toString())
}

fun File.deleteRecursively() {
    if (this.exists()) {
        if (this.isFile() ) {
            this.delete();
        } else {
            this.listFiles().forEach{
                it.deleteRecursively()
            }
            this.delete()
        }
    }
}

fun File.unzip(descDir: String): Boolean {
    if (!this.exists()) {
        return false
    }
    val descDirCanonical = File(descDir).canonicalFile
    val buffer = ByteArray(1024)
    var outputStream: OutputStream? = null
    var inputStream: InputStream? = null
    var zf: ZipFile? = null
    try {
        zf = ZipFile(this.toString())
        val entries = zf.entries()
        while (entries.hasMoreElements()) {
            val zipEntry: ZipEntry = entries.nextElement() as ZipEntry
            val zipEntryName: String = zipEntry.name

            // 防止 Zip Slip：校验解压目标路径是否在 descDir 内
            val descFilePath = File(descDirCanonical, zipEntryName).canonicalFile
            if (!descFilePath.startsWith(descDirCanonical)) {
                logger.error { "Zip Slip detected: $zipEntryName resolves outside target directory" }
                zf.close()
                return false
            }

            if (zipEntry.isDirectory) {
                createDir(descFilePath.toString())
            } else {
                inputStream = zf.getInputStream(zipEntry)
                val descFile: File = createFile(descFilePath.toString())
                outputStream = FileOutputStream(descFile)

                var len: Int
                while (inputStream.read(buffer).also { len = it } > 0) {
                    outputStream.write(buffer, 0, len)
                }
                inputStream.close()
                outputStream.close()
            }
        }
        return true
    } catch(e: Exception) {
        e.printStackTrace()
    } finally {
        inputStream?.close()
        outputStream?.close()
        zf?.close()
    }
    return false
}

fun File.zip(zipFilePath: String): Boolean {
    if (!this.exists()) {
        return false
    }
    if (this.isDirectory()) {
        val files = this.listFiles()
        val filesList: List<File> = files.toList()
        return zip(filesList, zipFilePath)
    } else {
        return zip(arrayListOf(this), zipFilePath)
    }
}

fun zip(files: List<File>, zipFilePath: String): Boolean {
    if (files.isEmpty()) {
        return false
    }

    val zipFile = createFile(zipFilePath)
    val buffer = ByteArray(1024)
    var zipOutputStream: ZipOutputStream? = null
    var inputStream: FileInputStream? = null
    try {
        zipOutputStream = ZipOutputStream(FileOutputStream(zipFile))
        for (file in files) {
            if (!file.exists()) continue
            zipOutputStream.putNextEntry(ZipEntry(file.name))
            inputStream?.close()
            inputStream = FileInputStream(file)
            var len: Int
            while (inputStream.read(buffer).also { len = it } > 0) {
                zipOutputStream.write(buffer, 0, len)
            }
            zipOutputStream.closeEntry()
        }
        return true
    } catch(e: Exception) {
        e.printStackTrace()
    } finally {
        inputStream?.close()
        zipOutputStream?.close()
    }
    return false
}

fun createDir(filePath: String): File {
    val file = File(filePath)
    if (!file.exists()) {
        file.mkdirs()
    }
    return file
}

fun createFile(filePath: String): File {
    val file = File(filePath)
    val parentFile = file.parentFile
    if (parentFile != null && !parentFile.exists()) {
        parentFile.mkdirs()
    }
    if (!file.exists()) {
        file.createNewFile()
    }
    return file
}











