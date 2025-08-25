import { Box, Typography } from "@mui/material"



const DiscountHome = ({ discount }) => {

    return (
        <>
            <Box sx={{
                backgroundColor: "#307FE0",
                width: {
                    xs: 'clamp(100px, 26vw, 140px)',
                    sm: 'clamp(120px, 18vw, 170px)',
                    md: 'clamp(140px, 16vw, 180px)'
                },
                flex: '0 0 auto',
                mx: 1,
                my: 2,
                display: 'flex',
                justifyContent: 'center',
                borderRadius: '24px',
                transition: 'transform 0.3s ease',
                scrollSnapAlign: 'center',
                '&:hover': {
                    transform: 'scale(1.05)',
                },
                cursor: 'pointer'
            }}>
                <Typography
                  variant="h4"
                  sx={{
                    margin: { xs: "14px", sm: "18px" },
                    fontFamily: "Poetsen One, sans-serif",
                    fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4rem' },
                    letterSpacing: "2px",
                    color: "#ff93d5",
                    fontWeight: 'bold'
                  }}>
                    {discount}
                </Typography>
            </Box>
        </>
    )
}

export default DiscountHome