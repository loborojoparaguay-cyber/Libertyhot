-- ============================================================
-- Libertyhot - Buckets de Storage (Supabase Storage)
-- ============================================================
-- Para empezar 100% gratis, usamos Supabase Storage (1GB gratis).
-- Cuando crezcas, migras el bucket "content" a Bunny.net sin tocar el resto del esquema.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),        -- fotos de perfil, publicas
  ('content', 'content', false),       -- fotos/videos de creadores, PRIVADO
  ('kyc-documents', 'kyc-documents', false) -- documentos de identidad, PRIVADO, solo admin
on conflict (id) do nothing;

-- Politica: cualquiera puede ver avatars (bucket publico ya lo permite).

-- Politica: solo el dueño puede subir a su carpeta dentro de "content"
-- Convencion de carpetas: content/{creator_id}/archivo.jpg
create policy "Creador sube su propio contenido"
  on storage.objects for insert
  with check (
    bucket_id = 'content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Creador borra su propio contenido"
  on storage.objects for delete
  using (
    bucket_id = 'content'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- La LECTURA de "content" NO se abre por policy publica: se sirve mediante
-- Signed URLs generadas desde el servidor (Route Handler) solo si el usuario
-- tiene una suscripcion activa o pago realizado. Ver src/lib/content-access.ts

-- kyc-documents: solo el propio creador sube, nadie lee via policy de cliente
-- (el admin revisa usando la Service Role Key desde el servidor).
create policy "Creador sube sus documentos KYC"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
