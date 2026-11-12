-- ClickFunnels' after-purchase emails for the MIDI Drum Kit (2026-10-29), one
-- sequence per language (db/email-series.sql): "How to use" (ClickFunnels sent
-- it 5 minutes after the order; sequences count in hours, so 1 hour, after the
-- receipt), the "Fragments" tip 24 hours after the order, the "Bonus" folder 48
-- hours after that. They start for each new buyer-midi-drum-kit tag. Edited
-- from then on in dashboard → Automations. Run once.
begin;

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('MIDI Drum Kit · after purchase (English)', 'buyer-midi-drum-kit', 'en', true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$How to use MIDI Drum Kit - A Google Doc Link$body$, $body$Hey Beatmaker,

We put together a very simple document with a few tips on how to get the best use out of the MIDI Drum Kit.

It's nothing fancy — just a few notes on how we intended the files to be used so you can get started quickly.

**[Click here to access the Google Doc on how to use MIDI Drum Kit in your DAW](https://docs.google.com/document/d/e/2PACX-1vRb1KHNY5p1HfUCmsLKUCvleVBSTFH-J60O2d57y0KXFbICwFpiVxwAxelqfa4T0ORpQ559S8tm5tXF/pub)**

Let us know if you have any suggestions, feedback or questions. We're here to help.

Hope it helps with your workflow.

Best,
Grind Studio Team$body$),
  (1, 23, $body$Quick tip: The "Fragments" folder 📂$body$, $body$Hey!

It's been 24 hours since you grabbed the **MIDI Drum Kit Bundle**.

I hope you've already dragged a few files into your DAW and started cooking up.

I wanted to send a quick email to make sure you are getting the absolute most out of this pack, because there is a "hidden" feature that many producers overlook.

You probably noticed that the pack is divided into **Full Patterns** and **Fragments**.

Most people just drag the "Full Pattern" in and call it a day.

That works great for speed, but if you want to unlock the real power of this bundle (and get infinite unique bounces), try this workflow:

**The "Mix & Match" Method:**

Instead of using one full loop, build your drums like a puzzle:

**The Foundation:** Drag a Kick Pattern from Folder A.

**The Groove:** Drag a Hi-Hat Fragment from Folder B.

**The Sauce:** Drag a Percussion/Snare Fragment from Folder C.

Because these are MIDI files (not audio loops), they instantly lock to your tempo and work with whatever drum sounds you choose.

By mixing fragments, you aren't just using the patterns we gave you.

You are creating thousands of custom combinations that nobody else has.

**💡 Pro Tip:**
Since MIDI is just raw data, try dragging a **Hi-Hat MIDI pattern** onto a melodic instrument (like a Pluck or a Piano VST). It creates complex, rhythmic textures that are perfect for background melodies.

If you've made anything crazy with the kit yet, hit reply and send it over. I'd love to hear what you're working on.

Happy producing,
Grind Studio$body$),
  (2, 48, $body$Did you check the "Bonus" folder?$body$, $body$Hey,

I know when you download a big bundle, it's easy to get lost in the main folders and forget the rest.

But I wanted to remind you that you have a secret weapon sitting on your hard drive right now:

**The "Beat Starters" & "Famous Beats" Bonuses.**

We included these for those days when you sit down at the computer and have zero ideas (we all have those days).

Next time you have "Beat Block," try this:

Open **Bonus #2 (Beat Starters)**.

Drag a random chord progression MIDI into your favorite synth.

Then, drag your **Drum MIDI patterns** underneath it.

In about 30 seconds, you skip the "staring at a blank screen" phase and go straight to the fun part.

Don't let those bonuses collect dust! They are there to save you time.

Talk soon,
Grind Studio$body$)
) as v(position, delay_hours, subject, body);

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('MIDI Drum Kit · after purchase (French)', 'buyer-midi-drum-kit', 'fr', true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$Comment utiliser le MIDI Drum Kit - Un lien Google Doc$body$, $body$Salut Beatmaker,

On a préparé un document très simple avec quelques conseils pour tirer le meilleur du MIDI Drum Kit.

Rien de compliqué — juste quelques notes sur la façon dont on a pensé l'utilisation des fichiers, pour que tu puisses démarrer vite.

**[Clique ici pour ouvrir le Google Doc sur l'utilisation du MIDI Drum Kit dans ta DAW](https://docs.google.com/document/d/e/2PACX-1vRb1KHNY5p1HfUCmsLKUCvleVBSTFH-J60O2d57y0KXFbICwFpiVxwAxelqfa4T0ORpQ559S8tm5tXF/pub)**

Dis-nous si tu as des suggestions, des retours ou des questions. On est là pour t'aider.

J'espère que ça t'aidera dans ton workflow.

À bientôt,
L'équipe Grind Studio$body$),
  (1, 23, $body$Astuce rapide : le dossier « Fragments » 📂$body$, $body$Salut !

Ça fait 24 heures que tu as pris le **MIDI Drum Kit Bundle**.

J'espère que tu as déjà glissé quelques fichiers dans ta DAW et que tu as commencé à cuisiner.

Je voulais t'envoyer un petit email pour être sûr que tu tires vraiment le maximum de ce pack, parce qu'il y a une fonction « cachée » que beaucoup de producteurs ne voient pas.

Tu as sûrement remarqué que le pack est divisé en **Full Patterns** et **Fragments**.

La plupart des gens glissent juste le « Full Pattern » et s'arrêtent là.

Ça marche très bien pour aller vite, mais si tu veux libérer la vraie puissance de ce bundle (et avoir des bounces uniques à l'infini), essaie ce workflow :

**La méthode « Mix & Match » :**

Au lieu d'utiliser une seule boucle complète, construis tes drums comme un puzzle :

**La base :** glisse un pattern de kick du dossier A.

**Le groove :** glisse un fragment de hi-hat du dossier B.

**La sauce :** glisse un fragment de percussion/snare du dossier C.

Comme ce sont des fichiers MIDI (pas des boucles audio), ils se calent instantanément sur ton tempo et marchent avec les sons de batterie que tu choisis.

En mélangeant les fragments, tu n'utilises pas juste les patterns qu'on t'a donnés.

Tu crées des milliers de combinaisons sur mesure que personne d'autre n'a.

**💡 Astuce de pro :**
Comme le MIDI, ce ne sont que des données brutes, essaie de glisser un **pattern MIDI de hi-hat** sur un instrument mélodique (comme un pluck ou un VST de piano). Ça crée des textures rythmiques complexes, parfaites pour des mélodies de fond.

Si tu as déjà fait un truc de fou avec le kit, réponds à cet email et envoie-le-moi. J'adorerais entendre ce que tu prépares.

Bonne prod,
Grind Studio$body$),
  (2, 48, $body$Tu as regardé le dossier « Bonus » ?$body$, $body$Salut,

Je sais que quand tu télécharges un gros bundle, c'est facile de se perdre dans les dossiers principaux et d'oublier le reste.

Mais je voulais te rappeler que tu as une arme secrète sur ton disque dur en ce moment :

**Les bonus « Beat Starters » et « Famous Beats ».**

On les a inclus pour les jours où tu t'assois devant l'ordi avec zéro idée (on a tous ces jours-là).

La prochaine fois que tu as le « blocage créatif », essaie ça :

Ouvre le **Bonus N°2 (Beat Starters)**.

Glisse un MIDI de progression d'accords au hasard dans ton synthé préféré.

Ensuite, glisse tes **patterns MIDI de batterie** en dessous.

En 30 secondes environ, tu sautes la phase « fixer un écran vide » et tu passes direct à la partie fun.

Ne laisse pas ces bonus prendre la poussière ! Ils sont là pour te faire gagner du temps.

À bientôt,
Grind Studio$body$)
) as v(position, delay_hours, subject, body);

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('MIDI Drum Kit · after purchase (Spanish)', 'buyer-midi-drum-kit', 'es', true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$Cómo usar el MIDI Drum Kit - Un enlace a Google Doc$body$, $body$Hola, beatmaker:

Preparamos un documento muy sencillo con algunos consejos para sacarle el máximo partido al MIDI Drum Kit.

No es nada del otro mundo: solo unas notas sobre cómo pensamos que se usaran los archivos, para que empieces rápido.

**[Haz clic aquí para abrir el Google Doc sobre cómo usar el MIDI Drum Kit en tu DAW](https://docs.google.com/document/d/e/2PACX-1vRb1KHNY5p1HfUCmsLKUCvleVBSTFH-J60O2d57y0KXFbICwFpiVxwAxelqfa4T0ORpQ559S8tm5tXF/pub)**

Cuéntanos si tienes sugerencias, comentarios o preguntas. Estamos aquí para ayudarte.

Esperamos que te ayude en tu flujo de trabajo.

Saludos,
El equipo de Grind Studio$body$),
  (1, 23, $body$Consejo rápido: la carpeta “Fragments” 📂$body$, $body$¡Hola!

Han pasado 24 horas desde que conseguiste el **MIDI Drum Kit Bundle**.

Espero que ya hayas arrastrado algunos archivos a tu DAW y hayas empezado a cocinar.

Quería mandarte un email rápido para asegurarme de que le sacas el máximo a este pack, porque hay una función “oculta” que muchos productores pasan por alto.

Seguramente notaste que el pack está dividido en **Full Patterns** y **Fragments**.

La mayoría simplemente arrastra el “Full Pattern” y ya está.

Eso funciona genial para ir rápido, pero si quieres liberar el verdadero poder de este bundle (y conseguir bounces únicos infinitos), prueba este flujo de trabajo:

**El método “Mix & Match”:**

En lugar de usar un solo loop completo, construye tu batería como un puzzle:

**La base:** arrastra un patrón de kick de la carpeta A.

**El groove:** arrastra un fragmento de hi-hat de la carpeta B.

**La salsa:** arrastra un fragmento de percusión/snare de la carpeta C.

Como son archivos MIDI (no loops de audio), se ajustan al instante a tu tempo y funcionan con los sonidos de batería que elijas.

Al mezclar fragmentos, no solo estás usando los patrones que te dimos.

Estás creando miles de combinaciones personalizadas que nadie más tiene.

**💡 Consejo pro:**
Como el MIDI son solo datos, prueba a arrastrar un **patrón MIDI de hi-hat** a un instrumento melódico (como un pluck o un VST de piano). Crea texturas rítmicas complejas, perfectas para melodías de fondo.

Si ya hiciste algo loco con el kit, responde a este email y mándamelo. Me encantaría escuchar en qué estás trabajando.

Feliz producción,
Grind Studio$body$),
  (2, 48, $body$¿Revisaste la carpeta “Bonus”?$body$, $body$Hola:

Sé que cuando descargas un bundle grande es fácil perderse en las carpetas principales y olvidarse del resto.

Pero quería recordarte que ahora mismo tienes un arma secreta en tu disco duro:

**Los bonos “Beat Starters” y “Famous Beats”.**

Los incluimos para esos días en que te sientas frente al ordenador y no tienes ni una idea (todos tenemos esos días).

La próxima vez que tengas “bloqueo creativo”, prueba esto:

Abre el **Bono #2 (Beat Starters)**.

Arrastra un MIDI de progresión de acordes al azar a tu sintetizador favorito.

Luego, arrastra tus **patrones MIDI de batería** debajo.

En unos 30 segundos, te saltas la fase de “mirar una pantalla en blanco” y vas directo a la parte divertida.

¡No dejes que esos bonos acumulen polvo! Están ahí para ahorrarte tiempo.

Hablamos pronto,
Grind Studio$body$)
) as v(position, delay_hours, subject, body);

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('MIDI Drum Kit · after purchase (German)', 'buyer-midi-drum-kit', 'de', true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$So nutzt du das MIDI Drum Kit - Ein Google-Doc-Link$body$, $body$Hey Beatmaker,

wir haben ein ganz einfaches Dokument mit ein paar Tipps zusammengestellt, wie du das Beste aus dem MIDI Drum Kit herausholst.

Nichts Besonderes – nur ein paar Notizen dazu, wie wir die Dateien gedacht haben, damit du schnell loslegen kannst.

**[Klick hier für das Google Doc dazu, wie du das MIDI Drum Kit in deiner DAW nutzt](https://docs.google.com/document/d/e/2PACX-1vRb1KHNY5p1HfUCmsLKUCvleVBSTFH-J60O2d57y0KXFbICwFpiVxwAxelqfa4T0ORpQ559S8tm5tXF/pub)**

Sag uns Bescheid, wenn du Vorschläge, Feedback oder Fragen hast. Wir sind für dich da.

Hoffentlich hilft es dir bei deinem Workflow.

Viele Grüße
Dein Grind Studio Team$body$),
  (1, 23, $body$Kurzer Tipp: Der „Fragments“-Ordner 📂$body$, $body$Hey!

Es ist 24 Stunden her, dass du dir das **MIDI Drum Kit Bundle** geholt hast.

Ich hoffe, du hast schon ein paar Dateien in deine DAW gezogen und angefangen zu kochen.

Ich wollte dir kurz schreiben, damit du wirklich das Maximum aus diesem Pack holst, denn es gibt eine „versteckte“ Funktion, die viele Producer übersehen.

Du hast wahrscheinlich bemerkt, dass das Pack in **Full Patterns** und **Fragments** aufgeteilt ist.

Die meisten ziehen einfach das „Full Pattern“ rein und das war's.

Das ist super fürs Tempo, aber wenn du die echte Power dieses Bundles freischalten willst (und unendlich viele einzigartige Bounces), probier diesen Workflow:

**Die „Mix & Match“-Methode:**

Statt einen kompletten Loop zu nehmen, bau deine Drums wie ein Puzzle:

**Das Fundament:** Zieh ein Kick-Pattern aus Ordner A rein.

**Der Groove:** Zieh ein Hi-Hat-Fragment aus Ordner B rein.

**Die Sauce:** Zieh ein Percussion-/Snare-Fragment aus Ordner C rein.

Weil das MIDI-Dateien sind (keine Audio-Loops), passen sie sich sofort deinem Tempo an und funktionieren mit allen Drum-Sounds, die du wählst.

Wenn du Fragmente mischst, nutzt du nicht nur die Patterns, die wir dir gegeben haben.

Du erschaffst Tausende eigene Kombinationen, die sonst niemand hat.

**💡 Profi-Tipp:**
Da MIDI nur rohe Daten sind, zieh mal ein **Hi-Hat-MIDI-Pattern** auf ein melodisches Instrument (z. B. ein Pluck oder ein Piano-VST). Das erzeugt komplexe, rhythmische Texturen, perfekt für Hintergrundmelodien.

Wenn du mit dem Kit schon was Krasses gemacht hast, antworte einfach und schick es mir. Ich würde gern hören, woran du arbeitest.

Viel Spaß beim Producen
Grind Studio$body$),
  (2, 48, $body$Hast du den „Bonus“-Ordner gecheckt?$body$, $body$Hey,

ich weiß, wenn man ein großes Bundle runterlädt, verliert man sich leicht in den Hauptordnern und vergisst den Rest.

Aber ich wollte dich daran erinnern, dass gerade eine Geheimwaffe auf deiner Festplatte liegt:

**Die Boni „Beat Starters“ & „Famous Beats“.**

Wir haben sie für die Tage dazugepackt, an denen du dich an den Rechner setzt und null Ideen hast (solche Tage kennen wir alle).

Wenn du das nächste Mal eine „Beat-Blockade“ hast, probier das:

Öffne **Bonus #2 (Beat Starters)**.

Zieh eine zufällige Akkordfolge als MIDI in deinen Lieblingssynth.

Dann zieh deine **Drum-MIDI-Patterns** darunter.

In etwa 30 Sekunden überspringst du die Phase „auf einen leeren Bildschirm starren“ und kommst direkt zum spaßigen Teil.

Lass diese Boni nicht verstauben! Sie sind da, um dir Zeit zu sparen.

Bis bald
Grind Studio$body$)
) as v(position, delay_hours, subject, body);

with s as (
  insert into public.sequences (name, trigger_tag, lang, active)
  values ('MIDI Drum Kit · after purchase (Italian)', 'buyer-midi-drum-kit', 'it', true)
  returning id
)
insert into public.sequence_steps (sequence_id, position, delay_hours, subject, body)
select s.id, v.position, v.delay_hours, v.subject, v.body from s, (values
  (0, 1, $body$Come usare il MIDI Drum Kit - Un link a un Google Doc$body$, $body$Ehi Beatmaker,

abbiamo preparato un documento molto semplice con qualche consiglio per sfruttare al meglio il MIDI Drum Kit.

Niente di speciale: solo qualche nota su come abbiamo pensato l'uso dei file, così puoi iniziare subito.

**[Clicca qui per aprire il Google Doc su come usare il MIDI Drum Kit nella tua DAW](https://docs.google.com/document/d/1SCLyy-Pw_boLAplfXUSPWOb5fq0IjK2C0U1ak5pqQCs/view)**

Facci sapere se hai suggerimenti, feedback o domande. Siamo qui per aiutarti.

Speriamo che ti aiuti nel tuo workflow.

A presto,
Il team di Grind Studio$body$),
  (1, 23, $body$Consiglio veloce: la cartella “Fragments” 📂$body$, $body$Ehi!

Sono passate 24 ore da quando hai preso il **MIDI Drum Kit Bundle**.

Spero che tu abbia già trascinato qualche file nella tua DAW e iniziato a cucinare.

Volevo mandarti una email veloce per assicurarmi che tu stia sfruttando al massimo questo pack, perché c'è una funzione “nascosta” che molti producer non notano.

Probabilmente hai notato che il pack è diviso in **Full Patterns** e **Fragments**.

La maggior parte delle persone trascina il “Full Pattern” e finisce lì.

Funziona benissimo per andare veloci, ma se vuoi sbloccare la vera potenza di questo bundle (e avere infiniti bounce unici), prova questo workflow:

**Il metodo “Mix & Match”:**

Invece di usare un solo loop completo, costruisci la tua batteria come un puzzle:

**Le fondamenta:** trascina un pattern di kick dalla cartella A.

**Il groove:** trascina un fragment di hi-hat dalla cartella B.

**La salsa:** trascina un fragment di percussioni/snare dalla cartella C.

Visto che sono file MIDI (non loop audio), si agganciano subito al tuo tempo e funzionano con qualsiasi suono di batteria tu scelga.

Mescolando i fragment, non stai solo usando i pattern che ti abbiamo dato.

Stai creando migliaia di combinazioni personalizzate che nessun altro ha.

**💡 Consiglio da pro:**
Visto che il MIDI è solo un insieme di dati, prova a trascinare un **pattern MIDI di hi-hat** su uno strumento melodico (come un pluck o un VST di piano). Crea texture ritmiche complesse, perfette per le melodie di sottofondo.

Se hai già fatto qualcosa di pazzesco con il kit, rispondi a questa email e mandamelo. Mi piacerebbe sentire a cosa stai lavorando.

Buona produzione,
Grind Studio$body$),
  (2, 48, $body$Hai controllato la cartella “Bonus”?$body$, $body$Ehi,

so che quando scarichi un bundle grande è facile perdersi nelle cartelle principali e dimenticare il resto.

Ma volevo ricordarti che in questo momento hai un'arma segreta sul tuo hard disk:

**I bonus “Beat Starters” e “Famous Beats”.**

Li abbiamo inclusi per quei giorni in cui ti siedi al computer e non hai nessuna idea (capitano a tutti).

La prossima volta che hai il “blocco creativo”, prova così:

Apri il **Bonus #2 (Beat Starters)**.

Trascina un MIDI di progressione di accordi a caso nel tuo synth preferito.

Poi trascina i tuoi **pattern MIDI di batteria** sotto.

In circa 30 secondi salti la fase “fissare uno schermo vuoto” e vai dritto alla parte divertente.

Non lasciare che quei bonus prendano polvere! Sono lì per farti risparmiare tempo.

A presto,
Grind Studio$body$)
) as v(position, delay_hours, subject, body);

-- French: a no-break space before : ; ! ? » and after « (landing.ts frenchSpaces).
update public.sequence_steps st
set subject = replace(regexp_replace(st.subject, ' ([:;!?»])', chr(160) || '\1', 'g'), '« ', '«' || chr(160)),
    body = replace(regexp_replace(st.body, ' ([:;!?»])', chr(160) || '\1', 'g'), '« ', '«' || chr(160))
from public.sequences s
where s.id = st.sequence_id and s.name = 'MIDI Drum Kit · after purchase (French)';

commit;
