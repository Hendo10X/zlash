package expo.modules.zlashnative

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.github.junrar.Archive
import com.github.junrar.exception.UnsupportedRarV5Exception
import com.github.junrar.rarfile.FileHeader
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class Rar5Exception :
  CodedException("ERR_RAR5", "This CBR uses the RAR5 format, which Zlash can't open yet. Re-pack it as CBZ to read it.", null)

class ZlashNativeModule : Module() {
  private fun fileFrom(uri: String): File {
    val path: String? = if (uri.startsWith("file://")) Uri.parse(uri).path else uri
    return File(requireNotNull(path) { "Invalid file URI: $uri" })
  }

  /** RAR entry names may use Windows separators; normalise to '/'. */
  private fun entryName(header: FileHeader): String = header.fileName.replace(BACKSLASH, '/')

  private fun <T> withPdf(uri: String, block: (PdfRenderer) -> T): T {
    val fd: ParcelFileDescriptor = ParcelFileDescriptor.open(fileFrom(uri), ParcelFileDescriptor.MODE_READ_ONLY)
    return fd.use { descriptor -> PdfRenderer(descriptor).use { renderer -> block(renderer) } }
  }

  private fun <T> withRar(uri: String, block: (Archive) -> T): T {
    try {
      return Archive(fileFrom(uri)).use { archive -> block(archive) }
    } catch (e: UnsupportedRarV5Exception) {
      throw Rar5Exception()
    }
  }

  private fun renderPage(uri: String, index: Int, targetWidth: Int, outUri: String): Map<String, Int> =
    withPdf(uri) { renderer: PdfRenderer ->
      renderer.openPage(index).use { page: PdfRenderer.Page ->
        val width = targetWidth.coerceIn(200, 2400)
        val height = (width.toDouble() * page.height / page.width).toInt().coerceAtLeast(1)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        bitmap.eraseColor(Color.WHITE) // PDF pages are transparent by default
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        val out = fileFrom(outUri)
        out.parentFile?.mkdirs()
        FileOutputStream(out).use { stream -> bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream) }
        bitmap.recycle()
        mapOf("width" to width, "height" to height)
      }
    }

  private fun listEntries(uri: String): List<String> =
    withRar(uri) { archive: Archive ->
      archive.fileHeaders.filter { header: FileHeader -> !header.isDirectory }.map { header: FileHeader -> entryName(header) }
    }

  private fun extractEntry(uri: String, name: String, outUri: String) {
    withRar(uri) { archive: Archive ->
      val header: FileHeader = archive.fileHeaders.firstOrNull { h: FileHeader -> entryName(h) == name }
        ?: throw IllegalArgumentException("Entry not found: $name")
      val out = fileFrom(outUri)
      out.parentFile?.mkdirs()
      FileOutputStream(out).use { stream -> archive.extractFile(header, stream) }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ZlashNative")

    AsyncFunction("pdfPageCount") { uri: String ->
      withPdf(uri) { renderer: PdfRenderer -> renderer.pageCount }
    }

    AsyncFunction("renderPdfPage") { uri: String, index: Int, targetWidth: Int, outUri: String ->
      renderPage(uri, index, targetWidth, outUri)
    }

    AsyncFunction("listRarEntries") { uri: String ->
      listEntries(uri)
    }

    AsyncFunction("extractRarEntry") { uri: String, name: String, outUri: String ->
      extractEntry(uri, name, outUri)
    }
  }

  companion object {
    private const val BACKSLASH = '\\'
  }
}
