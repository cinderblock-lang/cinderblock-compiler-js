#include <stdlib.h>
#include <dlfcn.h>

typedef struct blob
{
  void *data;
  int length;
} blob;

blob_ptr_free(blob *subject)
{
  free(subject->data);
  free(subject);
}

blob_free(blob subject)
{
  free(subject.data);
}

#define safe_free(x) _Generic((x), blob *: blob_ptr_free, blob: blob_free, default: free)(x)

char GetChar(blob input, int index)
{
  if (input.length < index)
  {
    return 0;
  }

  char *blob_data = input.data;

  return blob_data[index];
}

int Length(blob input)
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

size_t CSize(blob input)
{
  return sizeof(input.data);
}

char *CBuffer(blob input)
{
  return input.data;
}