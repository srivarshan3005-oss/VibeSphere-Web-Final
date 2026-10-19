package com.vibesphere.api.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiExceptionHandlerTest {
    @RestController static class Dummy {
        @GetMapping("/t/{id}") String byId(@PathVariable Long id) { return "ok"; }
        @GetMapping("/forbidden") String forbidden() { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot do that"); }
        @GetMapping("/boom") String boom() { throw new IllegalStateException("secret internal detail"); }
    }

    private MockMvc mvc;

    @BeforeEach void setUp() { mvc = MockMvcBuilders.standaloneSetup(new Dummy()).setControllerAdvice(new ApiExceptionHandler()).build(); }

    @Test void nonNumericIdIs400NotServerError() throws Exception {
        mvc.perform(get("/t/abc")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    }

    @Test void responseStatusReasonBecomesMessage() throws Exception {
        mvc.perform(get("/forbidden")).andExpect(status().isForbidden()).andExpect(jsonPath("$.message").value("You cannot do that"));
    }

    @Test void unexpectedErrorsDoNotLeakInternals() throws Exception {
        mvc.perform(get("/boom")).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Something went wrong. Please try again."));
    }
}
