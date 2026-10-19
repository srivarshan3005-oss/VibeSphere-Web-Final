package com.vibesphere.api.upload;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UploadSignatureTest {
    @Test void acceptsJpeg() { assertEquals("jpg", UploadController.detectExtension(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0}, 12)); }
    @Test void acceptsPng() { assertEquals("png", UploadController.detectExtension(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0}, 12)); }
    @Test void acceptsWebp() { assertEquals("webp", UploadController.detectExtension(new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'}, 12)); }
    @Test void rejectsHtmlDisguisedAsImage() { assertNull(UploadController.detectExtension("<html><body>".getBytes(), 12)); }
    @Test void rejectsTruncatedInput() { assertNull(UploadController.detectExtension(new byte[]{(byte) 0xFF, (byte) 0xD8}, 2)); }
}
