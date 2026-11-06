// BASE DE DATOS PARA LAS INVITACIONES
const SUPABASE_URL = "https://faordzxwqrrusaxjqike.supabase.co";
const SUPABASE_KEY = "sb_publishable_Os62BAjsb3EWOqOJY4u_MQ_rWVyQN5Q";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Configuración de la Fecha del Evento (31 de Diciembre de 2026, 10:00 PM)
const partyDate = new Date(2026, 11, 31, 22, 0, 0).getTime();

// 2. Lógica de la Cuenta Regresiva
function updateCountdown() {
  const now = Date.now();
  const difference = partyDate - now;

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (difference <= 0) {
    if (daysEl) daysEl.innerText = "0";
    if (hoursEl) hoursEl.innerText = "00";
    if (minutesEl) minutesEl.innerText = "00";
    if (secondsEl) secondsEl.innerText = "00";
    return;
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  if (daysEl) daysEl.innerText = days;
  if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
  if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// 3. Validación y Conexión con Supabase para Invitados
document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoInvitado = urlParams.get('invitado');

  const nameInput = document.getElementById('guest-name');
  const rsvpContainer = document.getElementById('rsvp-container');
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');

  if (!codigoInvitado) {
    if (rsvpContainer) {
      rsvpContainer.innerHTML = `
        <div class="p-6 bg-[#05070c] border border-[#D4AF37]/40 text-center space-y-4 my-4">
          <div class="w-10 h-10 border border-[#D4AF37]/30 bg-[#0a0e17] mx-auto flex items-center justify-center text-[#D4AF37]">
            <i data-lucide="lock" class="w-5 h-5"></i>
          </div>
          <div class="space-y-1">
            <p class="text-[#D4AF37] font-bold uppercase tracking-wider text-sm font-serif-luxury">Enlace Personal Requerido</p>
            <p class="text-xs text-slate-300 tracking-wider">Por favor, utiliza el enlace personalizado que se te envió por WhatsApp para poder confirmar tu asistencia.</p>
          </div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('invitados')
      .select('*')
      .eq('codigo', codigoInvitado.toLowerCase())
      .maybeSingle();

    if (error || !data) {
      if (rsvpContainer) {
        rsvpContainer.innerHTML = `
          <div class="p-6 bg-[#05070c] border border-red-500/40 text-center space-y-4 my-4">
            <div class="w-10 h-10 border border-red-500/30 bg-[#0a0e17] mx-auto flex items-center justify-center text-red-400">
              <i data-lucide="x-circle" class="w-5 h-5"></i>
            </div>
            <div class="space-y-1">
              <p class="text-red-400 font-bold uppercase tracking-wider text-sm font-serif-luxury">Invitación No Encontrada</p>
              <p class="text-xs text-slate-300 tracking-wider">El código de invitación no es válido o no existe en el sistema.</p>
            </div>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      return;
    }

    if (data.estado === 'Confirmado') {
      if (rsvpContainer) {
        rsvpContainer.innerHTML = `
          <div class="p-6 bg-[#05070c] border border-[#D4AF37]/40 text-center space-y-4 my-4">
            <div class="w-10 h-10 border border-[#D4AF37]/30 bg-[#0a0e17] mx-auto flex items-center justify-center text-[#D4AF37]">
              <i data-lucide="alert-circle" class="w-5 h-5"></i>
            </div>
            <div class="space-y-1">
              <p class="text-[#D4AF37] font-bold uppercase tracking-wider text-sm font-serif-luxury">Invitación Ya Utilizada</p>
              <p class="text-xs text-slate-300 tracking-wider">Hola <span class="text-white font-bold">${data.nombre}</span>, esta invitación ya fue confirmada anteriormente y no puede volverse a utilizar.</p>
            </div>
          </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      return;
    }

    if (nameInput) {
      nameInput.value = data.nombre;
      nameInput.readOnly = true;
      nameInput.title = "Este nombre está asociado a tu invitación personal";
    }

    // 4. Manejar el envío del formulario RSVP conectado a Supabase
    if (rsvpForm) {
      rsvpForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const selectedGuest = document.querySelector('input[name="guests"]:checked');
        const count = selectedGuest ? selectedGuest.value : "0";

        const text = count === "0"
          ? `¡Hola César! Soy ${data.nombre} y confirmo mi asistencia a tus 18 años. Iré solo(a). ¡Nos vemos el 31!`
          : `¡Hola César! Soy ${data.nombre} y confirmo mi asistencia a tus 18 años. Asistiré con ${count} acompañante(s). ¡Nos vemos el 31!`;

        const phone = "51981995393";
        const message = encodeURIComponent(text);

        const { error: updateError } = await supabaseClient
          .from('invitados')
          .update({
            estado: 'Confirmado',
            acompaniantes: count
          })
          .eq('codigo', codigoInvitado.toLowerCase());

        if (updateError) {
          console.error("Error al actualizar Supabase:", updateError);
          alert("Hubo un error al procesar tu confirmación. Inténtalo de nuevo.");
          return;
        }

        if (typeof confetti === 'function') {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FFF1B0', '#D4AF37', '#AA7C11', '#ffffff']
          });
        }

        setTimeout(() => {
          if (rsvpContainer) rsvpContainer.style.display = 'none';
          if (rsvpSuccess) rsvpSuccess.style.display = 'block';

          window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        }, 1000);
      });
    }

  } catch (err) {
    console.error("Error de conexión con Supabase:", err);
  }
});

// 5. Reproductor de Música con Ecualizador Animado
const musicBtn = document.getElementById('music-btn');
const musicBtnText = document.getElementById('music-btn-text');
const bgMusic = document.getElementById('bg-music');
const equalizer = document.getElementById('equalizer');
let isPlaying = false;

if (musicBtn && bgMusic) {
  musicBtn.addEventListener('click', function () {
    if (isPlaying) {
      bgMusic.pause();
      musicBtnText.innerText = "Reproducir Música";
      equalizer.classList.remove('music-playing');
      isPlaying = false;
    } else {
      bgMusic.play().then(() => {
        musicBtnText.innerText = "Pausar Música";
        equalizer.classList.add('music-playing');
        isPlaying = true;
      }).catch(error => {
        console.error("Error al reproducir audio:", error);
      });
    }
  });
}

// 6. Interacción del Sobre Digital + Copiado Automático a Portapapeles
const envelopeWrapper = document.getElementById('envelope-wrapper');
const envelopeHint = document.getElementById('envelope-hint');
const yapeNumber = "981995393";
const copyBadge = document.getElementById('copy-badge');

if (envelopeWrapper) {
  envelopeWrapper.addEventListener('click', function () {
    this.classList.toggle('open');

    if (this.classList.contains('open')) {
      envelopeHint.innerText = "✨ Toca para cerrar el sobre";

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(yapeNumber).then(showCopyFeedback).catch(err => {
          console.error("Error al copiar al portapapeles: ", err);
        });
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = yapeNumber;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showCopyFeedback();
      }
    } else {
      envelopeHint.innerText = "✨ Toca para abrir el sobre";
      if (copyBadge) copyBadge.style.opacity = '0';
    }
  });
}

function showCopyFeedback() {
  if (copyBadge) {
    copyBadge.style.opacity = '1';
    setTimeout(() => {
      copyBadge.style.opacity = '0';
    }, 2500);
  }
}