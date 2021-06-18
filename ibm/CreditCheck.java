// camel-k: language=java dependency=camel-openapi-java open-api=ibm-sap-creditcheck.yaml
import org.apache.camel.builder.RouteBuilder;

import java.util.Map;
import java.util.HashMap;

public class CreditCheck extends RouteBuilder {

  
  

  @Override
  public void configure() throws Exception {

    from("direct:creditcheck")
      .setBody().constant("{\"result\":true}")
    ;
  
  

  }

  
}
