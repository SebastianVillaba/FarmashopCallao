import { Pagination, PaginationItem, Stack } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const CustomPagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <Stack spacing={2} sx={{ mt: 3, justifyContent: 'center', alignItems: 'center' }}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        variant="outlined"
        color="#fdcd05"
        siblingCount={1}
        boundaryCount={1}
        renderItem={(item) => (
          <PaginationItem
            slots={{ previous: ChevronLeft, next: ChevronRight }}
            {...item}
            sx={{
              mx: 0.5,
              '&.Mui-selected': {
                fontWeight: 'bold',
                backgroundColor: '#fdcd05',
                color: 'white'
              }
            }}
          />
        )}
        sx={{
          '& .MuiPagination-ul': {
            flexWrap: 'nowrap'
          }
        }}
      />
    </Stack>
  );
};

export default CustomPagination;