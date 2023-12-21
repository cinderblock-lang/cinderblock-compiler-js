typedef struct _Scope
{
  void **children;
  int child_count;
} _Scope;

_Scope *_CreateScope()
{
  _Scope *result = malloc(sizeof(_Scope));
  result->children = 0;
  result->child_count = 0;

  return result;
}

void *_Allocate(_Scope *scope, unsigned long size)
{
  void *result = malloc(size);

  void **new_children = malloc(sizeof(void *) * (scope->child_count + 1));
  for (int i = 0; i < scope->child_count; i++)
  {
    new_children[i] = scope->children[i];
  }

  new_children[scope->child_count] = result;

  free(scope->children);
  scope->children = new_children;

  return result;
}

void *_Return(_Scope *scope, void *result)
{
  for (int i = 0; i < scope->child_count; i++)
  {
    if (scope->children[i] != result)
      free(scope->children[i]);
  }

  free(scope->children);
  free(scope);

  return result;
}