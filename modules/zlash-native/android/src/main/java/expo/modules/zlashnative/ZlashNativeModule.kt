package expo.modules.zlashnative

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.github.junrar.Archive
import com.github.junrar.exception.UnsupportedRarV5Exception
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class Rar5Exception : CodedException("ERR_RAR5", "This CBR uses the RAR5 format, which Zlash can't open yet. Re-pack it as CBZ to read it.", null)

class ZlashNativeModule : Module() {
  private fun fileFrom(uri: String): File {
    val path = if (uri.startsWith("file://")) Uri.parse(uri).path else uri
    return File(requireNotNull(path) { "Invalid file URI: $uri" })
  }

  private fun <T> withPdf(uri: String, block: (PdfRenderer) -> T): T {
    val fd = ParcelFileDescriptor.open(fileFrom(uri), ParcelFileDescriptor.MODE_READ_ONLY)
    return fd.use { PdfRenderer(it).use(block) }
  }

  private fun <T> withRar(uri: String, block: (Archive) -> T): T {
    try {
      return Archive(fileFrom(uri)).use(block)
    } catch (e: UnsupportedRarV5Exception) {
      throw Rar5Exception()
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ZlashNative")

    AsyncFunction("pdfPageCount") { uri: String ->
      withPdf(uri) { it.pageCount }
    }

    AsyncFunction("renderPdfPage") { uri: String, index: Int, targetWidth: Int, outUri: String ->
      withPdf(uri) { renderer ->
        renderer.openPage(index).use { page ->
          val width = targetWidth.coerceIn(200, 2400)
          val height = (width.toDouble() * page.height / page.width).toInt().coerceAtLeast(1)
          val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
          bitmap.eraseColor(Color.WHITE) // PDF pages are transparent by default
          page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
          val out = fileFrom(outUri)
          out.parentFile?.mkdirs()
          FileOutputStream(out).use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }
          bitmap.recycle()
          mapOf("width" to width, "height" to height)
        }
      }
    }

    AsyncFunction("listRarEntries") { uri: String ->
      withRar(uri) { archive ->
        archive.fileHeaders.filter { !it.isDirectory }.map { it.fileName.replace('\', '/') }
      }
    }

    AsyncFunction("extractRarEntry") { uri: String, entryName: String, outUri: String ->
      withRar(uri) { archive ->
        val header = archive.fileHeaders.firstOrNull { it.fileName.replace('\', '/') == entryName }
          ?: throw IllegalArgumentException("Entry not found: $entryName")
        val out = fileFrom(outUri)
        out.parentFile?.mkdirs()
        FileOutputStream(out).use { archive.extractFile(header, it) }
      }
    }
  }
}
