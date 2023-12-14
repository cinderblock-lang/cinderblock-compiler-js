#include "memory.h"
#include <stdlib.h>
#include <stdio.h>

struct _List
{
  void **items;
  int count;
};

struct _MemoryBlock
{
  void *buffer;
  _Bool skip_delete;

  struct _List *children;
  struct _List *parents;
};

struct _MemoryScope
{
  struct _MemoryScope *parent;
  struct _List *blocks;
};

void cbfree(void *ptr)
{
  if (!ptr)
    return;
  printf("Freeing %p\n", ptr);
  free(ptr);
}

void _Add(struct _List *list, void *item)
{
  if (list->items == NULL)
  {
    list->items = malloc(sizeof(void *));
  }
  else
  {
    list->items = realloc(list->items, sizeof(void *) * (list->count + 1));
  }

  list->items[list->count] = item;
  list->count += 1;
  return;
}

void *_OpenScope(void *parent)
{
  struct _MemoryScope *parent_scope = parent;
  struct _MemoryScope *scope = malloc(sizeof(struct _MemoryScope));
  scope->parent = parent_scope;
  scope->blocks = malloc(sizeof(struct _List));
  scope->blocks->count = 0;
  scope->blocks->items = NULL;

  return scope;
}

size_t b_size = sizeof(struct _MemoryBlock);

void *_Allocate(void *scope_ptr, unsigned long size)
{
  struct _MemoryScope *scope = scope_ptr;

  char *data = malloc(b_size + size);
  struct _MemoryBlock *block = data;
  block->buffer = data + b_size;
  block->children = malloc(sizeof(struct _List));
  block->children->count = 0;
  block->children->items = NULL;

  block->parents = malloc(sizeof(struct _List));
  block->parents->count = 0;
  block->parents->items = NULL;

  block->skip_delete = 0;

  _Add(scope->blocks, block);

  return block->buffer;
}

void *_Assign(void *from, void *child_buffer, void *parent_buffer)
{
  if (!child_buffer)
  {
    return child_buffer;
  }

  struct _MemoryScope *scope = from;
  struct _MemoryBlock *child = (char *)child_buffer - b_size;
  struct _MemoryBlock *parent = (char *)parent_buffer - b_size;

  _Add(&parent->children, child);
  _Add(&child->parents, parent);

  return child_buffer;
}

void Reassign(struct _MemoryScope *target, struct _MemoryBlock *subject)
{
  _Add(&target->blocks, subject);
  subject->skip_delete = 1;

  for (int i = 0; i < subject->children->count; i++)
  {
    struct _MemoryBlock *child = subject->children->items[i];
    Reassign(target, child);
  }
}

void _Cleanup(void *subject)
{
  struct _MemoryScope *scope = subject;

  for (int i = 0; i < scope->blocks->count; i++)
  {
    struct _MemoryBlock *item = scope->blocks->items[i];
    if (!item)
      continue;

    if (item->skip_delete)
    {
      item->skip_delete = 0;
      continue;
    }

    if (item->children && item->children->items)
      cbfree(item->children->items);
    cbfree(item->children);
    if (item->parents && item->parents->items)
      cbfree(item->parents->items);
    cbfree(item->parents);
    cbfree(item);
  }

  if (scope->blocks->items)
    cbfree(scope->blocks->items);
  cbfree(scope->blocks);
  cbfree(scope);
}

void *_Return(void *from, void *value)
{
  struct _MemoryScope *from_scope = from;
  struct _MemoryScope *to_scope = from_scope->parent;

  for (int i = 0; i < from_scope->blocks->count; i++)
  {
    struct _MemoryBlock *item = from_scope->blocks->items[i];
    if (item->buffer == value)
    {
      Reassign(to_scope, item);
      break;
    }
  }

  _Cleanup(from_scope);

  return value;
}