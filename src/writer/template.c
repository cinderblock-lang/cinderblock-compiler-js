#include <stdlib.h>
#include <dlfcn.h>

typedef struct blob
{
  char *data;
  int length;
} blob;

char get_char(blob *input, int *index)
{
  if (input->length < *index)
  {
    return 0;
  }

  char *blob_data = input->data;

  return blob_data[*index];
}

int length(blob input)
{
  return input.length;
}

blob CreateString(char *input, int length)
{
  blob result;
  result.data = input;
  result.length = length;
  return result;
}

int c_size(blob input)
{
  return sizeof(input.data);
}

char *c_buffer(blob input)
{
  return input.data;
}