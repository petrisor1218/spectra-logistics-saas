-- Script pentru a muta toate VRID-urile cu vehiculul TR94FST de la WF SRL la Fast Express
-- cu comisionul corect (2% în loc de 4%)

-- Funcție pentru a calcula noul comision (2% în loc de 4%)
CREATE OR REPLACE FUNCTION calculate_new_commission(old_commission numeric) 
RETURNS numeric AS $$
BEGIN
  -- Calculăm suma originală din comisionul de 4% și aplicăm 2%
  RETURN ROUND((old_commission / 4.0) * 2.0, 4);
END;
$$ LANGUAGE plpgsql;

-- Pas 1: Mut VRID-urile specifice pentru fiecare săptămână
-- Săptămâna "9 iun. 2024 - 15 iun. 2024"
DO $$
DECLARE
  vrids_to_move TEXT[] := ARRAY['112YP4YMN', '111T3QVX3', '113XKXNMY', '115CY34HK', '114G61SHB', '11665ND2T', '114R6C61L'];
  vrid TEXT;
  vrid_data JSONB;
  new_commission NUMERIC;
  total_7_days NUMERIC := 0;
  total_30_days NUMERIC := 0;
  total_commission NUMERIC := 0;
BEGIN
  -- Pentru fiecare VRID care trebuie mutat
  FOREACH vrid IN ARRAY vrids_to_move LOOP
    -- Extrag datele VRID-ului din WF SRL
    SELECT processed_data->'WF SRL'->'VRID_details'->vrid 
    INTO vrid_data
    FROM weekly_processing 
    WHERE week_label = '9 iun. 2024 - 15 iun. 2024';
    
    IF vrid_data IS NOT NULL THEN
      -- Calculez noul comision (2% în loc de 4%)
      new_commission := calculate_new_commission((vrid_data->>'commission')::numeric);
      
      -- Actualizez datele cu noul comision
      vrid_data := jsonb_set(vrid_data, '{commission}', to_jsonb(new_commission));
      
      -- Adaug la totaluri
      total_7_days := total_7_days + COALESCE((vrid_data->>'7_days')::numeric, 0);
      total_30_days := total_30_days + COALESCE((vrid_data->>'30_days')::numeric, 0);
      total_commission := total_commission + new_commission;
      
      -- Adaug VRID-ul la Fast Express
      UPDATE weekly_processing
      SET processed_data = jsonb_set(
        jsonb_set(
          processed_data,
          '{"Fast Express"}',
          COALESCE(processed_data->'Fast Express', '{"Total_7_days": 0, "Total_30_days": 0, "Total_comision": 0, "VRID_details": {}}'::jsonb)
        ),
        array['Fast Express', 'VRID_details', vrid],
        vrid_data
      )
      WHERE week_label = '9 iun. 2024 - 15 iun. 2024';
      
      -- Elimin VRID-ul din WF SRL
      UPDATE weekly_processing
      SET processed_data = processed_data #- array['WF SRL', 'VRID_details', vrid]
      WHERE week_label = '9 iun. 2024 - 15 iun. 2024';
      
      RAISE NOTICE 'Mutat VRID % cu comision % -> %', vrid, (vrid_data->>'commission')::numeric, new_commission;
    END IF;
  END LOOP;
  
  -- Actualizez totalurile pentru Fast Express
  UPDATE weekly_processing
  SET processed_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        processed_data,
        '{"Fast Express", "Total_7_days"}',
        to_jsonb(COALESCE((processed_data->'Fast Express'->>'Total_7_days')::numeric, 0) + total_7_days)
      ),
      '{"Fast Express", "Total_30_days"}',
      to_jsonb(COALESCE((processed_data->'Fast Express'->>'Total_30_days')::numeric, 0) + total_30_days)
    ),
    '{"Fast Express", "Total_comision"}',
    to_jsonb(COALESCE((processed_data->'Fast Express'->>'Total_comision')::numeric, 0) + total_commission)
  )
  WHERE week_label = '9 iun. 2024 - 15 iun. 2024';
  
  -- Scad totalurile din WF SRL (cu comisioanele vechi de 4%)
  UPDATE weekly_processing
  SET processed_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        processed_data,
        '{"WF SRL", "Total_7_days"}',
        to_jsonb(COALESCE((processed_data->'WF SRL'->>'Total_7_days')::numeric, 0) - total_7_days)
      ),
      '{"WF SRL", "Total_30_days"}',
      to_jsonb(COALESCE((processed_data->'WF SRL'->>'Total_30_days')::numeric, 0) - total_30_days)
    ),
    '{"WF SRL", "Total_comision"}',
    to_jsonb(COALESCE((processed_data->'WF SRL'->>'Total_comision')::numeric, 0) - (total_commission * 2)) -- Scad comisionul vechi (care era dublu)
  )
  WHERE week_label = '9 iun. 2024 - 15 iun. 2024';
  
  RAISE NOTICE 'Terminat migrarea pentru săptămâna 9 iun. 2024 - 15 iun. 2024: % VRID-uri mutate', array_length(vrids_to_move, 1);
END $$;