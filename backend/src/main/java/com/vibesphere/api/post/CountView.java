package com.vibesphere.api.post;

/** Projection for "id -> count" native group-by queries (avoids N+1 counting). */
public interface CountView {
    Long getEntityId();
    Long getCnt();
}
