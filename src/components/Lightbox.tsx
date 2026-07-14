"use client";

import { useEffect } from "react";

/**
 * Modal a pantalla completa para ver una foto/video en tamaño grande.
 * Se cierra con el boton X, tocando el fondo oscuro, o con la tecla Escape.
 */
export default function Lightbox({
  url,
  mediaType,
  onClose,
}: {
  url: string;
  mediaType: "image" | "video";
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        {mediaType === "video" ? (
          <video src={url} controls autoPlay className="max-h-[90vh] max-w-full rounded-lg" />
        ) : (
          <img src={url} alt="Contenido en grande" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
        )}
      </div>
    </div>
  );
}
