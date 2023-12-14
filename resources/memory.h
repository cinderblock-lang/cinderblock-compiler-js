#ifndef MEMORY_H_
#define MEMORY_H_

void *_OpenScope(void *parent);
void *_Allocate(void *scope, unsigned long size);
void *_Assign(void *scope, void *child_buffer, void *parent_buffer);
void *_Return(void *scope, void *result);
void _Cleanup(void *scope);

#endif