import { Box, Typography } from "@mui/material"
import logo from '../assets/filpyhdsinfondo.png'

// Importa tus imágenes de servicios
import aireImg from '../assets/filtroAire.jpg'
import aceiteImg from '../assets/filtroAceite.png'
import combusImg from '../assets/filtroCombustible.jpg'
import refrigeranteImg from '../assets/filtroRefrigerante.jpg'
import hidraulicoImg from '../assets/filtroHidraulico.png' 

const servicios = [
  { src: aireImg,           title: 'FILTRACIÓN DE AIRE' },
  { src: aceiteImg,         title: 'FILTRACIÓN DE ACEITE' },
  { src: combusImg,         title: 'FILTRACIÓN DE COMBUSTIBLE' },
  { src: refrigeranteImg,   title: 'FILTRACION REFRIGERANTE' },
  { src: hidraulicoImg,     title: 'FILTRACION HIDRAULICA' },
]

const IntroduccionEmpresa = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        px: 2,
      }}
    >
      <Box sx={{my: 4}}>
        <img src={logo} alt="LOGO DE FILPY" width={300} />
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3.5,
          }}
        >
          <Typography variant="body1">
            En FILPY nos especializamos en ofrecer soluciones integrales de filtración que combinan innovación y sostenibilidad para tus procesos industriales. En FILPY S.A. ponemos a tu disposición un completo catálogo de filtros de aire, aceite, combustible, refrigerante, hidráulicos y de caja, diseñados para maximizar el rendimiento de tus equipos, reducir costos de mantenimiento y minimizar el impacto ambiental.
          </Typography>
          <Typography variant="h4" sx={{ color: 'rgba(193, 76, 73, 0.9)', fontWeight: 'bold' }}>
            TU ALIADO EN FILTRACIÓN INDUSTRIAL
          </Typography>
          <Typography>
            FILPY S.A. se posiciona como tu socio estratégico en el mercado, respaldada por la calidad de nuestros productos, la experiencia de nuestro equipo y un servicio postventa de excelencia.
          </Typography>
        </Box>
      </Box>

      {/* ------------------ SECCIÓN DE SERVICIOS ------------------ */}
      <Box
        component="section"
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
          mt: 4,
          px: { xs: 1, md: 0 },
        }}
      >
        {servicios.map(({ src, title }) => (
          <Box
            key={title}
            sx={{
              width: 120,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 1,
            }}
          >
            <img src={src} alt={title} width={120} height={80}/>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {title}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ------------------ TEXTO ADICIONAL Y LISTA ------------------ */}
      <Box
        sx={{
          maxWidth: 800,
          mt: 4,
          textAlign: 'left',
        }}
      >
        <Typography paragraph>
          En FILPY S.A. somos una empresa con una firme vocación hacia la importacion y suministro de filtros para sistemas de filtración industrial y automovilistica, comprometidos con brindar un servicio de atención continua tanto en el mercado nacional como internacional.
        </Typography>
        <Typography paragraph>
          Como parte de nuestra filosofía de calidad, ofrecemos:
        </Typography>
        <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
          <li><Typography component="span" sx={{ fontWeight: 'bold' }}>Filtros de calidad internacional</Typography>, avalados por certificaciones ISO.</li>
          <li><Typography component="span" sx={{ fontWeight: 'bold' }}>Productos estándar y personalizados</Typography>, adaptados a las necesidades específicas de cada proyecto.</li>
          <li><Typography component="span" sx={{ fontWeight: 'bold' }}>Precios competitivos</Typography> y los tiempos de entrega más eficientes del mercado.</li>
        </Box>
        <Typography paragraph>
          Además, contamos con equipos de última generación y personal técnico altamente calificado para acompañarte en cada etapa: desde la selección hasta el mantenimiento de tus sistemas de filtración.
        </Typography>
      </Box>
    </Box>
  )
}

export default IntroduccionEmpresa
