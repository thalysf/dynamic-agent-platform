package com.thalys.agentflow.client;

import java.net.http.HttpClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.thalys.agentflow.dto.OrchestratorRunRequest;
import com.thalys.agentflow.dto.OrchestratorRunResponse;

@Component
public class OrchestratorClient {

    private final RestClient restClient;

    public OrchestratorClient(RestClient.Builder restClientBuilder,
            @Value("${agentflow.orchestrator.base-url}") String baseUrl) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .build();
    }

    public OrchestratorRunResponse run(OrchestratorRunRequest request) {
        return restClient.post()
                .uri("/orchestrations/run")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(OrchestratorRunResponse.class);
    }
}
