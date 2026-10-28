import { whatsappUrl } from '../lib/texto';

const WhatsAppLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5c0-5.19 4.23-9.41 9.42-9.41 2.51 0 4.88.98 6.65 2.76a9.35 9.35 0 0 1 2.75 6.66c0 5.19-4.23 9.41-9.41 9.41zm8.01-17.42A11.26 11.26 0 0 0 12.05.75C5.8.75.71 5.83.71 12.08c0 2 .52 3.95 1.52 5.66L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.41 1.38h.01c6.25 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.87-3.32-8.01z" />
  </svg>
);

export { WhatsAppLogo };

export default function FloatingBubble({ phoneNumber, message }) {
  return (
    <a
      href={whatsappUrl(phoneNumber, message)}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed right-4 bottom-20 z-30 flex items-center gap-2 lg:right-6 lg:bottom-6"
    >
      <span className="pointer-events-none hidden translate-x-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-800 opacity-0 shadow-card-hover transition group-hover:translate-x-0 group-hover:opacity-100 lg:block">
        ¿Te ayudamos?
      </span>
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-[#25d366]/40 transition group-hover:scale-110 animate-float">
        <WhatsAppLogo className="h-7 w-7" />
      </span>
    </a>
  );
}
