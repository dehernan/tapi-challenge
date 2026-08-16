📨

# Desafío técnico tapi — Frontend

Este desafío está diseñado para evaluar la capacidad de diseñar y construir
interfaces **robustas, escalables y mantenibles**, tomando buenas decisiones de
arquitectura frontend.

No buscamos "pixel perfect" ni una UI elaborada, y no esperamos que esté todo
terminado: priorizamos **criterio arquitectónico, manejo de datos a escala y calidad
de código** por encima de la cantidad de features.

---

## 👀 Problema

Una API interna expone una tabla de **registros/transacciones**, donde cada registro
tiene campos como `id`, `name`, `amount`, `currency`, `status`, `dueDate` y
`createdAt`. Se requiere construir un **panel de gestión** que permita:

- **Listar** los registros con paginación server-side, ordenamiento y **filtros
  combinables** (estado, rango de monto, rango de fecha y búsqueda por texto).
- Que **todo el estado de la vista** (filtros, orden, página) **viva en la URL**, de
  modo que la vista sea **compartible y recargable** sin perder contexto.
- **Selección masiva** de filas, incluyendo el caso "seleccionar los N registros que
  matchean el filtro actual" (no solo la página visible), y ejecutar una **acción
  bulk** sobre esa selección.
- Una **vista de detalle** de un registro que muestre información asociada (ej: un
  historial de eventos), cargada de forma independiente **sin bloquear** el resto del
  layout.
- Manejo explícito de estados **loading / empty / error**, contemplando **errores
  parciales**: que una sección falle no debe tumbar toda la página.

---

## 💭 Contexto de operación

- La tabla tiene **~1 millón de filas** y sigue creciendo. Los filtros son
  combinables, y el operador necesita saber **cuántos registros matchean** el filtro
  que aplicó.
- La latencia es variable y a veces alta.
- El panel se usa en **varios países**, con **múltiples monedas y locales**.
- Lo usan **operadores, muchas horas por día**, mayormente con teclado.
- Es una herramienta de negocio: cuando algo se rompe en producción, alguien tiene que
  enterarse.

---

## 📦 Entregables

**Un repositorio** (público o comprimido) con tres cosas:

**1. Un slice del panel, funcionando.** Conectá tu frontend a la API que te damos y
mostrá la tabla con **paginación** y **al menos un filtro** andando de punta a punta.
No hace falta más que eso a nivel código: es la base sobre la que discutimos el resto.
Incluí instrucciones de setup y, si tocaste la API que te dimos, esos cambios también.

**2. Un `ARCHITECTURE.md`** que le sirva a alguien que se suma al equipo para entender
el diseño, y a nosotros para entender **por qué elegiste lo que elegiste**. Acá va el
grueso del ejercicio: cómo resolverías el panel completo del problema aunque no lo hayas
construido, un **diagrama** del flujo de datos y las capas (ASCII, Mermaid, Excalidraw,
foto de una servilleta: nos da igual el medio, nos importa que se entienda), y un **plan
de desarrollo** (cómo escala a más features y entidades, qué dejás para una segunda
iteración).

**3. El refactor de composición** que está más abajo.

**Construí poco, diseñá todo.** El código del panel es deliberadamente chico; lo que
evaluamos es el criterio en el documento y el diseño del refactor. Qué priorizás y qué
dejás para el documento es parte de la señal.

Las ambigüedades del enunciado son intencionales: documentá tus supuestos y seguí
adelante.

*(Opcional)* Un **Loom corto** (5–10 min) recorriendo los trade-offs.

---

## 🔌 La API

**Te la damos armada**, para que no gastes tiempo generando datos ni montando un
backend. Es un contenedor con un proceso Node + Express y una base SQLite con el millón
de registros adentro: lo levantás con un `docker run`, corre en su propio puerto, y tu
proyecto lo armás desde cero apuntándole ahí.

Expone **un solo endpoint**, `GET /records`, que devuelve la tabla completa.

**Esa API es tuya: modelala como te parezca.** Agregá endpoints, cambiá el contrato,
partilo en varios recursos, elegí la forma de paginación que quieras. El código está
ahí y la base tiene SQL a mano. Lo que hagas del lado de la API **es parte de la
entrega**, y queremos leer en el `ARCHITECTURE.md` cómo decidiste modelar la frontera
entre tu frontend y ella — y si te parece que el contrato que te dimos está mal
diseñado, decilo.

---

## 🧩 Refactor de composición

Este componente tiene *boolean prop proliferation*: cada caso de uso nuevo agrega un
booleano y duplica los estados posibles.

**Refactorizalo a piezas componibles**, eliminando los condicionales y el
prop-drilling. Mostrá cómo queda **cada caso de uso al componerlo** y justificá el
diseño de la API.

Los subcomponentes (`Header`, `TextInput`, `Footer`, `Attachments`, etc.) son
triviales: stubbealos. El foco es la **API de composición**, no la UI.

```tsx
type ComposerProps = {
  onSubmit: (text: string) => void;
  value: string;
  onChange: (text: string) => void;
  isThread?: boolean;
  channelId?: string;
  isDM?: boolean;
  dmId?: string;
  isEditing?: boolean;
  isForwarding?: boolean;
  showAttachments?: boolean;
  showFormatting?: boolean;
  showEmojis?: boolean;
};

function Composer({
  onSubmit,
  value,
  onChange,
  isThread,
  channelId,
  isDM,
  dmId,
  isEditing,
  isForwarding,
  showAttachments = true,
  showFormatting = true,
  showEmojis = true,
}: ComposerProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      {!isEditing && <Header />}

      <TextInput value={value} onChange={(e) => onChange(e.target.value)} />

      {isDM ? (
        <AlsoSendToDMField id={dmId} />
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} />
      ) : null}

      <Footer>
        {showAttachments && !isEditing && <Attachments />}
        {showFormatting && <Formatting />}
        {showEmojis && <Emojis />}

        {isEditing ? (
          <>
            <CancelEditButton />
            <SaveEditButton />
          </>
        ) : isForwarding ? (
          <ForwardButton onClick={() => onSubmit(value)} />
        ) : (
          <SubmitButton onClick={() => onSubmit(value)} />
        )}
      </Footer>
    </form>
  );
}
```

---

## 💭 Stack recomendado

- **Next.js (App Router)** + **React** + **TypeScript strict**
- **TanStack Query** (server state) + **TanStack Table** (+ **Virtual** si aplica)
- **`nuqs`** para el estado en la URL
- **Zod** para validación en los bordes
- **Radix + TailwindCSS** (shadcn/ui) para UI
- **Vitest** + **Testing Library**, arquitectura **feature-sliced**

Es una recomendación, no un requisito. **Si preferís otra cosa, decilo y
argumentalo** — el disenso bien fundado suma, no resta.

---

## 🗣️ Defensa

Tras la entrega hay una sesión donde explicás tu solución y conversamos sobre
trade-offs, alternativas y cómo evolucionaría el diseño con más entidades encima.

---

_¡Éxitos!_
